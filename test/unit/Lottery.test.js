const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery Unit Tests", function () {
          let lottery, vrfCoordinatorV2Mock, lotteryEntranceFee, deployer, interval
          const chainId = network.config.chainId

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture("all")
              vrfCoordinatorV2Mock = ethers.getContract("VRFCoordinatorV2Mock", deployer)
              lottery = await ethers.getContract("Lottery", deployer)
              lotteryEntranceFee = await lottery.getEntranceFee()
              interval = await lottery.getInterval()
          })

          describe("constructor", function () {
              it("Initializes the lottery correctly", async function () {
                  // Ideally we make our tests have just 1 assert per "it"

                  // check the state of the lotter, should be Open on deployment
                  const lotteryState = await lottery.getLotteryState()
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

              it("records players when they enter", async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee })
                  const playerFromContract = await lottery.getPlayer(0)
                  assert.equal(playerFromContract, deployer)
              })

              it("emits event on enter", async function () {
                  const tx = await lottery.enterLottery({ value: lotteryEntranceFee })
                  const receipt = await tx.wait()
                  const logs = receipt.logs
                  // await expect(tx).to.emit(lottery, "LotteryEnter")
                  assert.equal(logs[0].args[0], deployer)
              })

              it("doesn't allow entrance when lottery is calculating", async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee })
                  await network.provider.send("evm_increaseTime", [Number(interval.toString()) + 1])
                  await network.provider.send("evm_mine", [])

                  // We pretend to be a Chainlink Keeper
                  await lottery.performUpkeep("0x")

                  await expect(
                      lottery.enterLottery({ value: lotteryEntranceFee })
                  ).to.be.revertedWith("Lottery__NotOpen")
              })
          })

          describe("checkUpkeep", function () {
              it("returns false if no one have sent any ETH", async function () {
                  // increase time past the set interval
                  await network.provider.send("evm_increaseTime", [Number(interval.toString()) + 1])
                  await network.provider.send("evm_mine", [])

                  const [upkeepNeeded] = await lottery.checkUpkeep("0x")
                  assert(!upkeepNeeded)
              })
          })
      })
