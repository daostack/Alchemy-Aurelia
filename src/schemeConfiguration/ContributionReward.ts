import { autoinject } from 'aurelia-framework';
import { SchemeConfigurator } from './schemeConfigurationBase';
import { VotingMachineInfo, VotingMachineConfig } from '../services/VotingMachineService';
import { ArcService } from "../services/ArcService";

@autoinject
export class ContributionReward implements SchemeConfigurator {

  orgNativeTokenFee = 0;
  votingMachineInfo = null;
  votingMachineConfig: VotingMachineConfig = <any>{};

  constructor(
    private arcService: ArcService
  ) {
  }

  activate(model) {
    model.getConfigurationHash = this.getConfigurationHash.bind(this);
  }

  async getConfigurationHash(orgAddress: string, schemeAddress?: string): Promise<any> {

    const voteParamsHash = await this.votingMachineConfig.getConfigurationHash(orgAddress, this.votingMachineInfo.address);

    return await this.arcService.setContractParameters({
      "voteParametersHash": voteParamsHash,
      "votingMachine": this.votingMachineInfo.address,
      "orgNativeTokenFee": this.orgNativeTokenFee,
    }, "ContributionReward", schemeAddress);
  }

}
