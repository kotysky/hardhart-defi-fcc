/////

const { getWeth, AMOUNT } = require("../scripts/getWeth")
const { ethers } = require("hardhat")

async function main() {
    await getWeth()

    const signer = await ethers.provider.getSigner()
    console.log("Signer:", signer.address) // When it is not a contract xxx.address
    // abi,addrees

    // Lending Pool Address Provider: 0xb53c1a33016b2dc2ff3653530bff1848a515c8c5
    // Lending Pool: ^

    const lendingPool = await getLendigPool(signer)
    const lendigPoolAdd = await lendingPool.getAddress() //When it is a contract  getAddress()
    console.log(`LendingPool address ${lendigPoolAdd}`)

    // deposit
    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    //approve

    await approveErc20(wethTokenAddress, lendigPoolAdd, AMOUNT, signer)
    console.log("Depositing...")

    await lendingPool.deposit(wethTokenAddress, AMOUNT, signer.address, 0)
    console.log("Deposited!!!")

    //How much we have borrowed, how much we have in collateral,
    // How much we can borrow

    let { availableBorrowsETH, totalCollateralETH } =
        await getBorrowUserData(lendingPool, signer)

    // availableBorrowsETH?? what the conversion rate on DAI is?

    const daiPrice = await getDaiPrice()
    const amountDaiToBorrow =
        availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toString())
    console.log("You can borrow ", amountDaiToBorrow, " DAI")
    const amountDaiToBorrowWei = ethers.parseEther(
        amountDaiToBorrow.toString(),
    )

    // Borrow Time
    const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"

    await borrowDai(
        daiTokenAddress,
        lendingPool,
        amountDaiToBorrowWei,
        signer,
    )
    await getBorrowUserData(lendingPool, signer)
    await repay(amountDaiToBorrowWei, daiTokenAddress, lendingPool, signer)
    await getBorrowUserData(lendingPool, signer)
}

async function repay(amount, daiAddress, lendingPool, account) {
    await approveErc20(daiAddress, lendingPool, amount, account)
    const repayTx = await lendingPool.repay(daiAddress, amount, 2, account)
    await repayTx.wait(1)
    console.log("Repaid!!")
}

async function borrowDai(
    daiAddress,
    lendingPool,
    amountDaiToBorrowWei,
    account,
) {
    const borrowTx = await lendingPool.borrow(
        daiAddress,
        amountDaiToBorrowWei,
        2,
        0,
        account,
    ) // all shown in lendigPool in aave web
    await borrowTx.wait(1)

    console.log("You´ve borrowed!")
}

async function getDaiPrice() {
    const daiEthPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        "0x773616E4d11A78F511299002da57A0a94577F1f4",
    ) // We dont need to assing to a signer or deployer because its just for reading purpose
    const price = (await daiEthPriceFeed.latestRoundData())[1] // This is the data on posicion "1" what que need from lastestRoundData
    console.log("The DAI/ETH price is: ", price)
    return price
}

async function getBorrowUserData(lendingPool, account) {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
        await lendingPool.getUserAccountData(account)
    console.log(
        "You have ",
        totalCollateralETH,
        " worth of ETH deposited.",
    )
    console.log("You have ", totalDebtETH, " worth of ETH borrowed.")
    console.log("You can borrow ", availableBorrowsETH, " worth of ETH.")
    return { availableBorrowsETH, totalDebtETH }
}

async function getLendigPool(account) {
    const lendingPoolAddressProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xb53c1a33016b2dc2ff3653530bff1848a515c8c5",
        account,
    )
    const lendingPoolAddress =
        await lendingPoolAddressProvider.getLendingPool() // Address of the pool
    const lendingPool = await ethers.getContractAt(
        "ILendingPool",
        lendingPoolAddress,
        account,
    ) // Contract of the pool
    return lendingPool
}
async function approveErc20(
    erc20Address,
    spenderAddress,
    amountToSpend,
    account,
) {
    const erc20Token = await ethers.getContractAt(
        "IERC20",
        erc20Address,
        account,
    )
    const tx = await erc20Token.approve(spenderAddress, amountToSpend)
    await tx.wait(1)
    console.log("Approved!!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
