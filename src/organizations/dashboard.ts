import { autoinject, computedFrom } from "aurelia-framework";
import { OrganizationService, DAO } from "../services/OrganizationService";
import { TokenService } from  "../services/TokenService";
import { ArcService } from  "../services/ArcService";
import { ControllerService } from  "../services/ControllerService";
import { SchemeService, SchemeInfo } from  "../services/SchemeService";
import "./dashboard.scss";
import { PLATFORM } from 'aurelia-pal';

@autoinject
export class DAODashboard {
  
  private org:DAO;
  private address:string;
  private orgName: string;
  private tokenSymbol: string;
  private userTokenbalance:Number;
  private schemesMap = new Map<string,DashboardSchemeInfo>();
  private get schemes(): Array<DashboardSchemeInfo> { return Array.from(this.schemesMap.values()); }
  // false if adding
  private state: State = State.Neither;
  private currentScheme: DashboardSchemeInfo;

  @computedFrom("state")
  private get using() { return this.state === State.Using; }

  @computedFrom("state")
  private get adding() { return this.state === State.Adding; }

  constructor(
    private organizationService: OrganizationService
    , private controllerService: ControllerService
    , private tokenService: TokenService
    , private arcService: ArcService
    , private schemeService: SchemeService
    
  ) {
  }

  async activate(options: any) {

    // so webpack can find them...
    PLATFORM.moduleName("../daoSchemeDashboards/GlobalConstraintRegistrar")
    PLATFORM.moduleName("../daoSchemeDashboards/NonArc")
    PLATFORM.moduleName("../daoSchemeDashboards/NotRegistered")
    PLATFORM.moduleName("../daoSchemeDashboards/SchemeRegistrar")
    PLATFORM.moduleName("../daoSchemeDashboards/SimpleContributionScheme")
    PLATFORM.moduleName("../daoSchemeDashboards/UpgradeScheme")
      
    this.address = options.address;
    this.org = await this.organizationService.organizationAt(this.address);
    this.orgName = await this.organizationService.organizationName(this.org);
    let token = this.org.token;
    this.tokenSymbol = await this.tokenService.getTokenSymbol(this.org.token);
    this.userTokenbalance = await this.tokenService.getUserTokenBalance(this.org.token);
    let schemesArray = (await this.schemeService.getSchemesInDao(this.address)).map((s) => { (<DashboardSchemeInfo>s).isRegistered = true; return s as DashboardSchemeInfo; });

    for (let scheme of schemesArray) {
      this.schemesMap.set(scheme.address, scheme);
    }
    /**
     * now merge the list of daos that the org has with daos that it doesn't have
     */

    let availableSchemes = this.schemeService.availableSchemes;
    for (let availableScheme of availableSchemes) {
      let found = this.schemesMap.get(availableScheme.address);
      if (!found) {
        (availableScheme as any).isRegistered = false;
        this.schemesMap.set(availableScheme.address, availableScheme as DashboardSchemeInfo );
      }
    }
    this.schemesMap.set("0x9ac0d209653719c86420bfca5d31d3e695f0b530", <DashboardSchemeInfo>{ address: "0x9ac0d209653719c86420bfca5d31d3e695f0b530" });
  }

  attached() {
    ($(".scheme-use-button") as any).tooltip();
    ($(".scheme-delete-button") as any).tooltip();
    ($(".scheme-add-button") as any).tooltip();
    ($(`.collapse`) as any).data("parent","#accordian");
    // workaround for accordian behavior not working.  Check to see if it's fixed when the
    // final version 4 is released
    $('.collapse').on('show.bs.collapse', () =>  {
      ($('.collapse') as any).collapse("hide");
    });
  }

  useScheme(scheme: DashboardSchemeInfo) {
    this.toggleDashboardVisibility(scheme, State.Using);
  }


  addScheme(scheme: DashboardSchemeInfo) {
    this.toggleDashboardVisibility(scheme, State.Adding);
  }

  onAddSchemeSubmit(scheme: DashboardSchemeInfo) {
    // this.controllerService.addSchemeToDao(this.org.address, scheme.key, scheme.address);
  }

  toggleDashboardVisibility(scheme: DashboardSchemeInfo, newState: State) {
    let currentState = this.state;

    if ((newState == currentState) && (currentState != State.Neither)) {
      newState = State.Neither;
    }

    // let currentScheme = this.currentScheme;
    // let newScheme = (newState != State.Neither) ? scheme: null;

    // if (newScheme && (newScheme != currentScheme)) {
    //   if (currentScheme) {
    //     ($(`#${currentScheme.key}`) as any).collapse("hide");
    //   }
    // }
    // this.currentScheme = newScheme;

    this.state = newState;
    
    // if ((newState == State.Neither) || (currentState == State.Neither) || (newScheme && (newScheme != currentScheme)))  {
    //   ($(`#${scheme.key}`) as any).collapse("toggle");
    // }
    if ((newState == State.Neither) || (currentState == State.Neither))  {
      ($(`#${scheme.key}`) as any).collapse("toggle");
    }
  }

  getDashboardView(scheme: DashboardSchemeInfo, using:boolean):string {
    if (using) {
      let key:string;
      if (!scheme.key) {
        key = "NonArc";
      } else if (!scheme.isRegistered) {
        key = "NotRegistered";
      } else {
        key = scheme.key;
      }
      return `../daoSchemeDashboards/${key}`;
    } else {
      return `../daoSchemeDashboards/schemeProposalParams/${scheme.key}`;
    }
  }

  canAddScheme(scheme: DashboardSchemeInfo) {
    return !scheme.isRegistered && !!scheme.key;
  }

  schemeDashboardViewModel(scheme: DashboardSchemeInfo, using:boolean): any {
    if (using) {
      return Object.assign(scheme, { org: this.org, orgName: this.orgName, tokenSymbol: this.tokenSymbol, allSchemes: this.schemes })
    } else {
      return { org: this.org, params: {} }
    }
  }

  removeScheme(scheme: DashboardSchemeInfo) {
    // this.controllerService.removeSchemeFromDao(this.org.avatar.address, scheme.key, scheme.address);
  }
}

export interface DashboardSchemeInfo extends SchemeInfo {
  isRegistered: boolean;
}

enum State {
  Neither,
  Adding,
  Using
}
