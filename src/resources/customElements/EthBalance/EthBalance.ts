import { bindable, containerless, customElement, autoinject } from 'aurelia-framework';
import { Web3Service } from "../../../services/Web3Service";

@autoinject
@containerless
@customElement("ethbalance")
export class EthBalance {

  private ethBalance: string = '';
  private ethAddress: string;
  private filter: any;

  constructor(private web3: Web3Service) {
    this.ethAddress = this.web3.defaultAccount;
  }

  text: string;

  attached() {
    this.readBalance();
  }

  detached() {
    if (this.filter) {
      this.filter.stopWatching();
      this.filter = null;
    }
  }

  async readBalance() {
    this.getBalance();
    /**
     * this is supposed to fire whenever a new block is created
     */
    this.filter = this.web3.eth.filter({ fromBlock: 'latest' }).watch(() => {
      this.getBalance();
    });
  }

  async getBalance() {
    try {
      this.ethBalance = this.web3.fromWei(await this.web3.getBalance(this.ethAddress)).toExponential(2);
      this.text = `${this.ethBalance} ETH`;
    } catch (ex) {
    }
  }
}
