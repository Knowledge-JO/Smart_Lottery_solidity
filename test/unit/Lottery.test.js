const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery Unit Tests", function () {
          let lottery, vrfCoordinatorV2Mock
          const chainId = network.config.chainId

          beforeEach(async function () {
              const { deployer } = await getNamedAccounts()
              await deployments.fixture("all")
              lottery = await ethers.getContract("Lottery", deployer)
              vrfCoordinatorV2Mock = ethers.getContract("VRFCoordinatorV2Mock", deployer)
          })

          describe("constructor", function () {
              it("Initializes the lottery correctly", async function () {
                  // Ideally we make our tests have just 1 assert per "it"

                  // check the state of the lotter, should be Open on deployment
                  const lotteryState = await lottery.getLotteryState()
                  const interval = await lottery.getInterval()
                  assert.equal(lotteryState.toString(), "0")
                  assert.equal(interval.toString(), networkConfig[chainId]["interval"])
              })
          })

          describe("enterLottery", function () {
              it("reverts when you don't send required entrance fee", async function () {
                  await expect(lottery.enterLottery()).to.be.reverted.revertedWith(
                      "Lottery__NotEnoughETHEntered"
                  )
              })
          })
      })
