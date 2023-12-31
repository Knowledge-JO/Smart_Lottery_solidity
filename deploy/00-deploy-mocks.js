const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

const BASE_FEE = ethers.parseEther("0.25") // 0.25 is the premium. It costs 0.25 link
const GAS_PRICE_LINK = 1e9 // link per gas. calculaed value based on the gas price of the chain
// chainlink nodes pay the gas fees to give us randomness & do external execution
// so the prices of request change based on the price of gas

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const args = [BASE_FEE, GAS_PRICE_LINK]
    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks")

        // deploy vrfcoordinator to local network
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args,
        })

        log("Mocks Deployed!!")
        log("-----------------------")
    }
}

module.exports.tags = ["all", "mocks"]
