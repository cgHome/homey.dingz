'use strict';

const OutputDevice = require('../output');

const FADETIME = 1; // Default 1-sec

module.exports = class LightDevice extends OutputDevice {

  async onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));
  }

  async initDingzConfig() {
    super.initDingzConfig();

    if (this.dingzConfig.light.dimmable) {
      if (!this.hasCapability('dim')) {
        await this.addCapability('dim')
          .then(() => this.logDebug('initDingzConfig() - dim capability added'))
          .catch((error) => this.logError(`initDingzConfig() - ${error}`));
      }
    } else if (this.hasCapability('dim')) {
      await this.removeCapability('dim')
        .then(() => this.logDebug('initDingzConfig() - dim capability removed'))
        .catch((error) => this.logError(`initDingzConfig() - ${error}`));
    }
  }

  onCapabilityOnOff(value, opts) {
    this.logDebug(`onCapabilityOnOff() > ${value} opts: ${JSON.stringify(opts)}`);

    const turn = value > 0 ? 'on' : 'off';
    const brightness = turn ? 100 : 0;
    const fadetime = (!opts.duration ? FADETIME : opts.duration) * 10;

    return this.sendCommand(`/light/${this.dataDevice}`, { turn, brightness, fadetime })
      .then(() => this.logNotice(`Set state > ${turn}`))
      .catch((error) => {
        this.logError(`onCapabilityOnOff() > sendCommand > ${error}`);
        return Promise.reject(error);
      });
  }

  onCapabilityDim(value, opts) {
    this.logDebug(`onCapabilityDim() > ${value} opts: ${JSON.stringify(opts)}`);

    const turn = value > 0 ? 'on' : 'off';
    const brightness = Math.round(value * 100);
    const fadetime = (!opts.duration ? FADETIME : opts.duration) * 10;

    return this.sendCommand(`/light/${this.dataDevice}`, { turn, brightness, fadetime })
      .then(() => this.logNotice(`Set state > brightness: ${brightness}`))
      .catch((error) => {
        this.logError(`onCapabilityDim() > sendCommand > ${error}`);
        return Promise.reject(error);
      });
  }

  onTopicState(topic, data) {
    super.onTopicState(topic, data);

    if (this.hasCapability('dim')) {
      this.setCapabilityValue('dim', data.turn === 'on' ? data.brightness / 100 : 0);
    }
  }

};
