const { existsSync } = require('fs');
const Web3 = require('web3');
require('dotenv').config()
// added for polyjuice
const { PolyjuiceHttpProvider, PolyjuiceAccounts } = require("@polyjuice-provider/web3");

const contractName = process.argv.slice(2)[0];

if (!contractName) {
    throw new Error(`No compiled contract specified to deploy. Please put it in "src/examples/2-deploy-contract/build/contracts" directory and provide its name as an argument to this program, eg.: "node index.js SimpleStorage.json"`);
}

let compiledContractArtifact = null;
const filenames = [`./build/contracts/${contractName}`, `./${contractName}`];
for(const filename of filenames)
{
    if(existsSync(filename))
    {
        console.log(`Found file: ${filename}`);
        compiledContractArtifact = require(filename);
        break;
    }
    else
        console.log(`Checking for file: ${filename}`);
}

if(compiledContractArtifact === null)
    throw new Error(`Unable to find contract file: ${contractName}`);

// added for polyjuice
const polyjuiceConfig = {
    rollupTypeHash: process.env.ROLLUP_TYPE_HASH,
    ethAccountLockCodeHash: process.env.ETH_ACCOUNT_LOCK_CODE_HASH,
    web3Url: process.env.WEB3_PROVIDER_URL
};
// added for polyjuice
const provider = new PolyjuiceHttpProvider(
    polyjuiceConfig.web3Url,
    polyjuiceConfig,
);

const web3 = new Web3(provider);

// added for polyjuice
web3.eth.accounts = new PolyjuiceAccounts(polyjuiceConfig);

const deployerAccount = web3.eth.accounts.wallet.add(process.env.DEPLOYER_PRIVATE_KEY);
web3.eth.Contract.setProvider(provider, web3.eth.accounts);

(async () => {
    const balance = BigInt(await web3.eth.getBalance(deployerAccount.address));

    if (balance === 0n) {
        console.log(`Insufficient balance. Can't deploy contract. Please deposit funds to your Ethereum address: ${deployerAccount.address}`);
        return;
    }

    console.log(`Deploying contract...`);

    const deployTx = new web3.eth.Contract(compiledContractArtifact.abi).deploy({
        data: getBytecodeFromArtifact(compiledContractArtifact),
        arguments: []
    }).send({
        from: deployerAccount.address,
        to: '0x' + new Array(40).fill(0).join(''),
        gas: 6000000,
        gasPrice: '0',
    });

    deployTx.on('transactionHash', hash => console.log(`Transaction hash: ${hash}`));
    deployTx.on('receipt', receipt => console.log(`Deployed contract address: ${receipt.contractAddress}`));
})();

function getBytecodeFromArtifact(contractArtifact) {
    return contractArtifact.bytecode || contractArtifact.data?.bytecode?.object
}