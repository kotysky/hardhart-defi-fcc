/////

const { getWeth, AMOUNT } = require("../scripts/getWeth")
const { ethers } = require("hardhat")

async function main() {
    await getWeth()

    const signer = await ethers.provider.getSigner()
    console.log("Signer:", signer.address)
    // abi,addrees

    // Lending Pool Address Provider: 0xb53c1a33016b2dc2ff3653530bff1848a515c8c5
    // Lending Pool: ^

    const lendingPool = await getLendigPool(signer)
    const lendigPoolAdd = await lendingPool.getAddress()
    console.log(`LendingPool address ${lendigPoolAdd}`)

    // deposit
    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    //approve

    await approveErc20(wethTokenAddress, lendigPoolAdd, AMOUNT, signer)
    console.log("Depositing...")

    await lendingPool.deposit(wethTokenAddress, AMOUNT, signer.address, 0)
    console.log("Deposited!!!")
}

async function getLendigPool(account) {
    const lendingPoolAddressProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xb53c1a33016b2dc2ff3653530bff1848a515c8c5",
        account,
    )
    const lendingPoolAddress = await lendingPoolAddressProvider.getLendingPool() // Address of the pool
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
