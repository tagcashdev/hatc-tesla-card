
var LitElement = LitElement || Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
var html = LitElement.prototype.html;
var css = LitElement.prototype.css;

function isObject(val) {
    return val instanceof Object; 
}

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function handleClick(node, hass, config, entityId){
    let e;
    if (!config){
        return;
    }

    // eslint-disable-next-line default-case
    switch (config.action) {
        case 'more-info': {
            e = new Event('hass-more-info', { composed: true });
            e.detail = {
                entityId: config.entity || entityId,
            };
            node.dispatchEvent(e);
            break;
        }
        case 'navigate': {
            if (!config.navigation_path) return;
            window.history.pushState(null, '', config.navigation_path);
            e = new Event('location-changed', { composed: true });
            e.detail = { replace: false };
            window.dispatchEvent(e);
            break;
        }
        case 'call-service': {
            if (!config.service) return;
            const [domain, service] = config.service.split('.', 2);
            const serviceData = { ...config.service_data };
            hass.callService(domain, service, serviceData);
            break;
        }
        case 'url': {
            if (!config.url) return;
            window.location.href = config.url;
        }
        case 'toggle': {
            hass.callService(config.service, "toggle", {
                entity_id: config.entity || entityId
            });
        }
    }
}

class HatcTeslaCard extends LitElement {
    static get properties() {
        return {
            hass: {},
            config: {}
        };
    }

    static getConfigElement() {
        console.log('getConfigElement');
    }

    static getStubConfig() {
        return { entity: "sun.sun" }
    }

    // Whenever the state changes, a new `hass` object is set. Use this to
    // update your content.
    render() {
        const hassEntity = this.hass.states[this.config.entity];
        if(hassEntity){
            return html`
                <ha-card class="HatcTeslaCard">
                    <img style="" src="./tesla-img/car.jpg">
                </ha-card>
            `;
        }else{
            return html`
                <div class="not-found">l'entité "${this.config.entity}" n'à pas été trouvé.</div>
            `;
        }
    }

    // The user supplied configuration. Throw an exception and Home Assistant
    // will render an error card.
    setConfig(config) {
        if (!config.entity) {
            throw new Error('Veuillez ajouter un "Entity" dans votre configuration');
        }
        this.config = config;
    }

    // The height of your card. Home Assistant uses this to automatically
    // distribute all cards over the available columns.
    getCardSize() {
        return this.config.entities.length + 1;
    }

    _toggle(state, service) {
        this.hass.callService(service, "toggle", {
            entity_id: state.entity_id
        });
    }

    _handlePopup(e) {
        var tap_action = this.config.tap_action || {};
        if (this.config.entity) {
            if (typeof this.config.tap_action === 'undefined') {
                tap_action = {
                    action: "more-info"  
                }
            }else{
                if(typeof this.config.tap_action.service === 'undefined'){
                    tap_action = {
                        service: "homeassistant",
                        ...tap_action
                    }
                }
            }
            e.stopPropagation();
            handleClick(this, this.hass, tap_action, this.config.entity);
        }
    }

    _handleEntities(e, entity) {
        var ent = entity || {};
        if (!ent['tap_action']) {
            ent = {
                tap_action: {
                    action: "more-info",
                    ...ent
                }
            }
        }
        e.stopPropagation();
        handleClick(this, this.hass, this.config.tap_action, false);
    }

    static get styles() {
        return css`
            :root, .HatcTeslaCard *{
                --mdc-icon-size: 16px;   
                --card-padding: 8px;
                background-color: #141518;
            }
        `;
    }
}

customElements.define('hatc-tesla-card', HatcTeslaCard);