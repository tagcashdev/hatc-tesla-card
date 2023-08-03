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


    console.log('switch');
    console.log(config.action);
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
            console.log('navigate');
            console.log(config.navigation_path);
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

function getIconBattery(level, statusCharge){
    var classIcon = '';
    var classLevel = '';
    var iconCharging = html``;
    var styleIcon = 'width:'+level+'%!important;';
    var icon = '';

    if(level >= 0 && level < 10){
        classIcon = 'bg-red';
    }else if(level >= 10 && level < 25){
        classIcon = 'bg-orange';
    }

    if(statusCharge == true){
        classIcon = 'bg-green';
        classLevel = 'green';
        icon = 'mdi:lightning-bolt';
        iconCharging = html`<span class="batteryItem"><ha-icon .icon="${icon}" class="icon ${classLevel}"></ha-icon></span>`;
    }

    return html`<span class="batteryItem"><div id="iconBatteryContainer"><div class="${classIcon}" id="iconBatteryLevel" style="${styleIcon}"></div></div></span><span id="batteryLevel" class="batteryItem ${classLevel}">${level}%</span>${iconCharging}`;
}

function getBatteryLevel(level, statusCharge){
    var classLevel = '';
    var iconCharging = html``;
    var icon = '';

    if(statusCharge == true){
        classLevel = 'green';
        icon = 'mdi:lightning-bolt';
        iconCharging = html`<span class="batteryItem"><ha-icon .icon="${icon}" class="icon ${classLevel}"></ha-icon></span>`;
    }

    return html`<span id="batteryLevel" class="batteryItem ${classLevel}">${level}%</span>${iconCharging}`;
}

function getStatus(park_brake, speed, statusCharge, timeToFull, teslaState){
    var r = '';

    if(teslaState != 'offline'){
        if(statusCharge == true){
            r = 'Il reste '+timeToFull+' avant d\'atteindre la limite de recharge.';
        }else{
            if(park_brake == 'on'){
                r = 'Stationnée';
            }else{
                r = speed;
            }
        }
    }
    return r;
}

function getChargeInfo(statusCharge, charge_limit_soc, charger_power, charge_energy_added, charger_actual_current, charger_voltage){
    var limit =  html`<div style="color:#ccc; font-weight: 600;">Limite de la recharge : ${charge_limit_soc}</div>`;

    var power =  html`<span>${charger_power}</span>`;
    var energyadded =  html`<span>${charger_power}</span>`;
    var energyadded =  html`<span>+${charge_energy_added}</span>`;
    var actualcurrent =  html`<span>${charger_actual_current}</span>`;
    var chargervoltage =  html`<span>${charger_voltage}</span>`;

    var data =  html`<div>${power} • ${energyadded} • ${actualcurrent} • ${chargervoltage}</div>`;

    if(statusCharge){
        return html`<div id="chargeContainer">${limit}${data}</div>`;
    }
    return html``;
}

function getNetwork(state){
    var icon = 'mdi:signal';
    if(state == 'offline'){
        icon = 'mdi:signal-off';
    }else if(state == 'asleep'){
        icon = 'mdi:sleep';
    }else if(state == 'suspended'){
        icon = 'mdi:car-wrench';
    }
    return html`<ha-icon .icon="${icon}" class="icon"></ha-icon>`;
    //return iconNetwork;
}

function getImage(chargeState, shiftState){
    var img = 'parked';

    if(chargeState == true){
        img = 'charging';
    }else{
        if(shiftState == 'D'){
            img = 'drive';
        }else if(shiftState == 'R'){
            img = 'reverse';
        }else if(shiftState == 'N'){
            img = 'drive';
        }
    }
    return img+'.png';
}

function getShiftState(shiftState, teslaState){
    var sState = 'P';

    if(teslaState != 'offline'){
        if(shiftState == 'D'){
            sState = 'D';
        }else if(shiftState == 'R'){
            sState = 'R';
        }else if(shiftState == 'N'){
            sState = 'N';
        }
    }
    return sState;
}

function getControls(locked, sentry, fan, insideTemperature, teslaState){
    var lockIcon = 'mdi:lock';
    var fanIcon = 'mdi:fan';
    var styleIcon = ''; var classIcon = '';

    if(locked == 'on'){
        // off = close || on = Open
        lockIcon = 'mdi:lock-open-variant';
        styleIcon = '-webkit-transform: scaleX(-1); transform: scaleX(-1); color: #ff3e58;';
    }
    var lock =  html`<ha-icon style="${styleIcon}" .icon="${lockIcon}" class="icon"></ha-icon>`;

    if(sentry == 'on'){
        // off = close || on = Open
        classIcon = 'active';
    }
    var sentry =  html`<div class="mode ${classIcon}"></div>`;

    if(fan == 'on'){
        // off = close || on = Open
        if(teslaState != 'offline'){
            classIcon = 'rotate active';
        }
    }
    var fan = html`<ha-icon .icon="${fanIcon}" class="icon"></ha-icon`;

    return html`<div id="controlsItems">
                <span id="lock">${lock}</span>
                <span id="sentry">${sentry}</span>
                <span id="insideTemp"><div class="iconFan ${classIcon}">${fan}</div><span class="tempFan">${insideTemperature}</span></span>
    </div>`;
}

function getTeslaData(dataSource, t){
    var tesla_battery_level = '';
    var tesla_battery = '';
    var tesla_display_name = '';
    var tesla_network = '';
    var tesla_park_brake = '';
    var tesla_speed = '';
    var tesla_status = '';
    var tesla_shift_state = '';
    var tesla_charge_energy_added = '';
    var tesla_charge_limit_soc = '';
    var tesla_charge_port_door_open = '';
    var tesla_charger_actual_current = '';
    var tesla_charger_phases = '';
    var tesla_charger_power = 0;
    var tesla_charger_power_unit = '';
    var tesla_charger_voltage = '';
    var tesla_time_to_full_charge = '';
    var tesla_charge_info = '';
    var tesla_on_charge = false;
    var tesla_state = '';
    var tesla_image = '';
    var tesla_controls = '';
    var tesla_sentry_mode = '';
    var tesla_locked = '';
    var tesla_inside_temp = '';
    var tesla_is_climate_on = '';
    var tesla_shift = '';

    if(dataSource == 'teslamate_mqtt'){
        tesla_battery_level = t.hass.states['sensor.tesla_battery_level'].state;
        tesla_display_name = t.hass.states['sensor.tesla_display_name'].state;
        tesla_park_brake = t.hass.states['binary_sensor.tesla_park_brake'].state;
        tesla_speed = t.hass.states['sensor.tesla_speed'].state + ' ' + t.hass.states['sensor.tesla_speed'].attributes.unit_of_measurement;
        tesla_charge_energy_added = t.hass.states['sensor.tesla_charge_energy_added'].state + ' ' + t.hass.states['sensor.tesla_charge_energy_added'].attributes.unit_of_measurement;
        tesla_charge_limit_soc = t.hass.states['sensor.tesla_charge_limit_soc'].state + t.hass.states['sensor.tesla_charge_limit_soc'].attributes.unit_of_measurement;
        tesla_charge_port_door_open = t.hass.states['binary_sensor.tesla_charge_port_door_open'].state;
        tesla_charger_actual_current = t.hass.states['sensor.tesla_charger_actual_current'].state + t.hass.states['sensor.tesla_charger_actual_current'].attributes.unit_of_measurement;
        tesla_charger_phases = t.hass.states['sensor.tesla_charger_phases'].state;
        tesla_charger_power = t.hass.states['sensor.tesla_charger_power'].state;
        tesla_charger_power_unit = tesla_charger_power + ' ' + t.hass.states['sensor.tesla_charger_power'].attributes.unit_of_measurement;
        tesla_charger_voltage = t.hass.states['sensor.tesla_charger_voltage'].state + t.hass.states['sensor.tesla_charger_voltage'].attributes.unit_of_measurement;
        tesla_time_to_full_charge = t.hass.states['sensor.tesla_time_to_full_charge'].state + t.hass.states['sensor.tesla_time_to_full_charge'].attributes.unit_of_measurement;
        tesla_state = t.hass.states['sensor.tesla_state'].state;
        tesla_shift_state = t.hass.states['sensor.tesla_shift_state'].state;
        tesla_sentry_mode = t.hass.states['binary_sensor.tesla_sentry_mode'].state;
        tesla_locked = t.hass.states['binary_sensor.tesla_locked'].state;
        tesla_inside_temp = t.hass.states['sensor.tesla_inside_temp'].state + t.hass.states['sensor.tesla_inside_temp'].attributes.unit_of_measurement;
        tesla_is_climate_on = t.hass.states['binary_sensor.tesla_is_climate_on'].state;
    }else if(dataSource == 'manuel'){
        tesla_battery_level = t.hass.states[t.config.data.battery_level].state;
        tesla_display_name = t.hass.states[t.config.data.display_name].state;
        tesla_park_brake = t.hass.states[t.config.data.park_brake].state;
    }

    if(tesla_charger_power > 0){tesla_on_charge = true;}

    tesla_battery = getIconBattery(tesla_battery_level, tesla_on_charge);
    tesla_battery_level = getBatteryLevel(tesla_battery_level, tesla_on_charge);
    tesla_status = getStatus(tesla_park_brake, tesla_speed, tesla_on_charge, tesla_time_to_full_charge, tesla_state);
    tesla_charge_info = getChargeInfo(tesla_on_charge, tesla_charge_limit_soc, tesla_charger_power_unit, tesla_charge_energy_added, tesla_charger_actual_current, tesla_charger_voltage);
    tesla_network = getNetwork(tesla_state);
    tesla_image = getImage(tesla_on_charge, getShiftState(tesla_shift_state, tesla_state));
    tesla_controls = getControls(tesla_locked, tesla_sentry_mode, tesla_is_climate_on, tesla_inside_temp, tesla_state);
    tesla_shift = getShiftState(tesla_shift_state, tesla_state);

    var r = {
        "tesla_display_name": tesla_display_name,
        "tesla_network": tesla_network,
        "tesla_battery_level": tesla_battery_level,
        "tesla_battery": tesla_battery,
        "tesla_status": tesla_status,
        "tesla_charge_info": tesla_charge_info,
        "tesla_image" : tesla_image,
        "tesla_controls" : tesla_controls,
        "tesla_shift" : tesla_shift
    }
    return r;
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
        const dataSource = this.config.data_source;
        const styleCard = this.config.style;

        if(hassEntity){

            var td = getTeslaData(dataSource, this);

            if(styleCard == 'mushroom'){
                return html`
                    <ha-card @click=${e => this._handlePopup(e)} class="HatcTeslaCard ${styleCard}">
                        <div id="pictureContainer">
                            <img class="tesla picture" style="" src="/local/hatc-tesla/${td.tesla_image}">
                        </div>

                        <div id="headerContainer">
                            <div id="displayName">${td.tesla_display_name}</div> <span>${td.tesla_shift}</span>
                        </div>
                        <div id="statusContainer">
                            <div id="batteryContainer">${td.tesla_battery_level}</div>
                        </div>
                        <div id="controlsContainer">
                            ${td.tesla_controls}
                        </div>
                    </ha-card>
                `;
            }else{
                return html`
                    <ha-card @click=${e => this._handlePopup(e)} class="HatcTeslaCard ${styleCard}">
                        <div id="headerContainer">
                            <div id="displayName">${td.tesla_display_name}</div>
                            <div id="network">${td.tesla_network}</div>
                        </div>
                        <div id="batteryContainer">${td.tesla_battery}</div>
                        <div id="statusContainer">${td.tesla_status}</div>
                        <img class="tesla" style="" src="/local/hatc-tesla/${td.tesla_image}">
                        <div id="controlsContainer">${td.tesla_controls}</div>
                        ${td.tesla_charge_info}
                    </ha-card>
                `;

            }
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
        return 3;
    }

    _toggle(state, service) {
        this.hass.callService(service, "toggle", {
            entity_id: state.entity_id
        });
    }

    _handlePopup(e) {
        console.log('_handlePopup');
        var tap_action = this.config.tap_action || {};
        console.log(tap_action);
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
            console.log('handleClick');
            console.log(tap_action);
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
                --spacing: var(--mush-spacing, 20px);
                --icon-size: var(--mush-icon-size, 42px);
                --mdc-icon-size: 24px;   
                --card-padding: 8px;
                color: #8a8b8d;
                font-weight: 600;
            }

            .HatcTeslaCard {
                background-color: rgb(23 24 28);
                padding: var(--spacing, 20px);
                font-size:16px;
            }

            .HatcTeslaCard #headerContainer{
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                justify-content: space-between;
                align-items: center;
                align-content: center;
            }

            .HatcTeslaCard #batteryContainer {
                display: flex;
                
                justify-content: flex-start; 
                align-items: center; 
                flex-direction: row; 
                flex-wrap: nowrap; 
                align-content: center;

                height: 100%;
                gap: 5px;
                margin-bottom: 5px;
            }

            .HatcTeslaCard #iconBatteryContainer {
                width: 39px;
                height: 16px;
                background-color: #2e2f34;
                border-radius:3px;
                padding:2px;
            }
            .HatcTeslaCard #iconBatteryLevel {
                background-color: #8a8b8d;
                height:100%;
                width:100%;
                border-radius:3px;
            }
            .HatcTeslaCard #batteryLevel {
                margin-left: 10px;
            }

            .HatcTeslaCard #controlsContainer{
                margin-bottom: 20px;
            }
            
            .HatcTeslaCard #controlsContainer #controlsItems{
                display: flex;
                flex-flow: row wrap;
                place-content: center space-between;
                align-items: center;
                justify-content: space-evenly;
                flex-direction: row;
            }

            .HatcTeslaCard #controlsContainer #controlsItems #lock{
            }

            .HatcTeslaCard #controlsContainer #controlsItems #sentry{
                font-size: 35px;
                display: inline-block;
                width: 18px;
                box-sizing: content-box;
                height: 18px;
                border: 3px solid #8a8b8d;
                position: relative;
                border-radius: 50%;
            }

            .HatcTeslaCard #controlsContainer #controlsItems #sentry .mode{
                width: 14px;
                height: 14px;
                background: #8a8b8d;
                border-radius: 50%;
                margin-top: 2px;
                margin-left: 2px;
            }

            .HatcTeslaCard #controlsContainer #controlsItems #sentry .mode.active{
                background: #ff3e58;
            }


            .HatcTeslaCard #controlsContainer #controlsItems #insideTemp .iconFan{
                display: inline-block;
            }
            .HatcTeslaCard #controlsContainer #controlsItems #insideTemp .tempFan{
                font-size: 11px;
                vertical-align: super;
            }

            .HatcTeslaCard #chargeContainer{
                background-color: #222326;
                width:calc(100% - 40px);
                padding: 20px;
                border-radius:3px;

            }
            .HatcTeslaCard #chargeContainer div, .HatcTeslaCard #chargeContainer span{
                font-weight: 400;
                font-size: 14px;
            }

            .HatcTeslaCard #displayName{
                font-size: var(--font-size, 22px);
                font-weight: 800;
                margin-bottom: 5px;
                color: #ccc;
            }
            .HatcTeslaCard img.tesla{
                width:100%;
                margin: 0 auto;
                display: block;
            }


            /* MushRoom Template */
            .HatcTeslaCard.mushroom *{
                --spacing: var(--mush-spacing, 8px);
                --icon-size: var(--mush-icon-size, 42px);
                --mdc-icon-size: 16px;   
                --card-padding: 8px;
                --font-size: 12px;
                font-weight: 600;
            }

            .HatcTeslaCard.mushroom #headerContainer{
                gap:5px;
                place-content: center space-between;
                justify-content: flex-start;
            }

            .HatcTeslaCard.mushroom img.tesla{
                width: 100%;
                display: block;
                border-radius: 5px;
                height: 100%;
                object-fit: cover;
            }

            .HatcTeslaCard.mushroom #batteryContainer, .HatcTeslaCard.mushroom #displayName{
                margin-bottom: 0;
                justify-content: flex-end;
            }

            .HatcTeslaCard.mushroom #controlsContainer #controlsItems #insideTemp .tempFan{
                vertical-align: unset;
            }

            .HatcTeslaCard.mushroom .container {
                position: relative;
                width: var(--icon-size);
                height: var(--icon-size);
                flex: 0 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .HatcTeslaCard.mushroom .container .picture {
                width: 100%;
                height: 100%;
                border-radius: var(--icon-border-radius);
            }

            .HatcTeslaCard.mushroom {
                background-color: rgb(23, 24, 28);
                padding: var(--spacing, 8px);
                font-size: 12px;
                display: grid;
                grid-template-columns: 1fr 1fr 1fr 1fr;
                grid-template-rows: 1fr 1fr;
                grid-gap: 1px;
            }

            .HatcTeslaCard.mushroom #controlsContainer{
                margin-bottom: 0;
            }

            
            .HatcTeslaCard.mushroom #controlsContainer #controlsItems {
                display: flex;
                flex-flow: wrap;
                place-content: center space-evenly;
                align-items: center;
                justify-content: flex-start;
                flex-direction: row;
                flex-wrap: nowrap;
                gap: 5px;
            }

            .HatcTeslaCard.mushroom #controlsContainer #controlsItems #sentry{
                width: 12px;
                height: 12px;
                border: 2px solid #8a8b8d;
            }

            .HatcTeslaCard.mushroom #controlsContainer #controlsItems #sentry .mode{
                width: 8px;
                height: 8px;
            }

            .HatcTeslaCard.mushroom #pictureContainer{
                grid-area: 1 / 1 / 3 / 2;
                width: 42px;
                height: 42px;
            }
            .HatcTeslaCard.mushroom #headerContainer{
                grid-area: 1 / 2 / 2 / 4;
            }
            .HatcTeslaCard.mushroom #statusContainer{
                grid-area: 1 / 4 / 2 / 5;
            }
            .HatcTeslaCard.mushroom #controlsContainer{
                grid-area: 2 / 2 / 3 / 5;
            }
            .HatcTeslaCard.mushroom  #batteryContainer{
                gap:0px;
            }


            .red{ color: rgb(244, 67, 54); }
            .pink{ color: rgb(233, 30, 99); }
            .purple{ color: rgb(156, 39, 176); }
            .deep-purple{ color: rgb(103, 58, 183); }
            .indigo{ color: rgb(63, 81, 181); }
            .blue{ color: rgb(33, 150, 243); }
            .light-blue{ color: rgb(3, 169, 244); }
            .cyan{ color: rgb(0, 188, 212); }
            .teal{ color: rgb(0, 150, 136); }
            .green{ color: rgb(76, 175, 80); }
            .light-green{ color: rgb(139, 195, 74); }
            .lime{ color: rgb(205, 220, 57); }
            .yellow{ color: rgb(255, 235, 59); }
            .amber{ color: rgb(255, 193, 7); }
            .orange{ color: rgb(255, 152, 0); }
            .deep-orange{ color: rgb(255, 87, 34); }
            .brown{ color: rgb(121, 85, 72); }
            .grey{ color: rgb(158, 158, 158); }
            .blue-grey{ color: rgb(96, 125, 139); }
            .black{ color: rgb(0, 0, 0); }
            .white, .played{ color: rgb(255, 255, 255); }

            .bg-red{ background-color: rgb(244, 67, 54) !important; }
            .bg-pink{ background-color: rgb(233, 30, 99) !important; }
            .bg-purple{ background-color: rgb(156, 39, 176) !important; }
            .bg-deep-purple{ background-color: rgb(103, 58, 183) !important; }
            .bg-indigo{ background-color: rgb(63, 81, 181) !important; }
            .bg-blue{ background-color: rgb(33, 150, 243) !important; }
            .bg-light-blue{ background-color: rgb(3, 169, 244) !important; }
            .bg-cyan{ background-color: rgb(0, 188, 212) !important; }
            .bg-teal{ background-color: rgb(0, 150, 136) !important; }
            .bg-green{ background-color: rgb(76, 175, 80) !important; }
            .bg-light-green{ background-color: rgb(139, 195, 74) !important; }
            .bg-lime{ background-color: rgb(205, 220, 57) !important; }
            .bg-yellow{ background-color: rgb(255, 235, 59) !important; }
            .bg-amber{ background-color: rgb(255, 193, 7) !important; }
            .bg-orange{ background-color: rgb(255, 152, 0) !important; }
            .bg-deep-orange{ background-color: rgb(255, 87, 34) !important; }
            .bg-brown{ background-color: rgb(121, 85, 72) !important; }
            .bg-grey{ background-color: rgb(158, 158, 158) !important; }
            .bg-blue-grey{ background-color: rgb(96, 125, 139) !important; }
            .bg-black{ background-color: rgb(0, 0, 0) !important; }
            .bg-white, .bg-played{ background-color: rgb(255, 255, 255) !important; }

            .rotate {
                animation: rotation 1.5s infinite linear;
            }
            
            @keyframes rotation {
                from {
                    transform: rotate(0deg);
                }
                to {
                    transform: rotate(360deg);
                }
            }
        `;
    }
}

customElements.define('hatc-tesla-card', HatcTeslaCard);