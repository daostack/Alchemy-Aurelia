import { autoinject, computedFrom, observable } from "aurelia-framework";
import { DaoSchemeDashboard } from "./schemeDashboard"
import { SchemeService, SchemeInfo } from "../services/SchemeService";
import { OrganizationService } from '../services/OrganizationService';
import { ArcService, ContractInfo, SchemeRegistrar, ProposeToAddModifySchemeParams, ProposeToRemoveSchemeParams } from "../services/ArcService";
import { EventAggregator } from 'aurelia-event-aggregator';
import { SchemeConfigurator } from '../schemeConfiguration/schemeConfigurationBase';
import { EventConfigTransaction, EventConfigException } from "../entities/GeneralEvents";
import { NonArcSchemeItemName } from "../resources/customElements/arcSchemesDropdown/arcSchemesDropdown";

@autoinject
export class SchemeRegistrarDashboard extends DaoSchemeDashboard {

  modifiedSchemeConfiguration: SchemeConfigurator = <any>{};
  schemeToModify: SchemeInfo = null;
  schemeToRemove: SchemeInfo = null;
  newSchemeConfiguration: SchemeConfigurator = <any>{ canBeRegisteringScheme: true };
  @observable currentSchemeSelection: SchemeInfo = null;
  schemeToAddAddress: string;
  hasSchemesToAdd: boolean;
  addableSchemes: Array<SchemeInfo> = [];
  addressControl: HTMLElement;
  NonArcSchemeItemKey = NonArcSchemeItemName;
  // autoRegister: boolean = true;

  constructor(
    private schemeService: SchemeService
    , private arcService: ArcService
    , private organizationService: OrganizationService
    , private eventAggregator: EventAggregator

  ) {
    super();
  }

  currentSchemeSelectionChanged() {
    if (this.currentSchemeSelection) {
      this.schemeToAddAddress = this.currentSchemeSelection.address;
    } else {
      this.schemeToAddAddress = undefined;
    }
    if (this.schemeToAddAddress) {
      $(this.addressControl).addClass("is-filled"); // annoying thing you have to do for BMD
    } else {
      $(this.addressControl).removeClass("is-filled"); // annoying thing you have to do for BMD
    }
  }

  @computedFrom("currentSchemeSelection")
  get isNonArcScheme() {
    return this.currentSchemeSelection && (this.currentSchemeSelection.name === NonArcSchemeItemName);
  }

  async addScheme() {
    try {

      const schemeRegistrar = await this.arcService.getContract("SchemeRegistrar") as SchemeRegistrar;
      let config: ProposeToAddModifySchemeParams = Object.assign({
        avatar: this.orgAddress
        , scheme: this.schemeToAddAddress
        , schemeParametersHash: await this.newSchemeConfiguration.getConfigurationHash(this.orgAddress, this.schemeToAddAddress)
      }, this.newSchemeConfiguration);


      if (!this.isNonArcScheme) {
        config.schemeName = this.currentSchemeSelection.name;
      }

      let tx = await schemeRegistrar.proposeToAddModifyScheme(config);

      this.eventAggregator.publish("handleSuccess", new EventConfigTransaction(
        `Proposal submitted to add ${this.schemeToAddAddress}`, tx.tx));

      this.currentSchemeSelection = null;

    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException(`Error proposing to add scheme ${this.schemeToAddAddress}`, ex));
    }
  }

  async modifyScheme() {

    try {
      const schemeRegistrar = await this.arcService.getContract("SchemeRegistrar") as SchemeRegistrar;
      const schemeParametersHash = await this.modifiedSchemeConfiguration.getConfigurationHash(this.orgAddress, this.schemeToModify.address);

      const tx = await schemeRegistrar.proposeToAddModifyScheme({
        avatar: this.orgAddress,
        scheme: this.schemeToModify.address,
        schemeName: this.schemeToModify.name,
        schemeParametersHash: schemeParametersHash
      });

      this.eventAggregator.publish("handleSuccess", new EventConfigTransaction(
        `Proposal submitted to modify ${this.schemeToModify.address}`, tx.tx));

    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException(`Error proposing to modify scheme ${this.schemeToModify.address}`, ex));
    }
  }

  async removeScheme() {

    try {

      const schemeRegistrar = await this.arcService.getContract("SchemeRegistrar") as SchemeRegistrar;

      let tx = await schemeRegistrar.proposeToRemoveScheme({
        avatar: this.orgAddress,
        scheme: this.schemeToRemove.address
      });

      this.eventAggregator.publish("handleSuccess", new EventConfigTransaction(
        `Proposal submitted to remove ${this.schemeToRemove.address}`, tx.tx));

      this.schemeToRemove = null;

    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException(`Error proposing to remove scheme ${this.schemeToRemove.address}`, ex));
    }
  }
}
