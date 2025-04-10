// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "./supportingContracts/ERC20.sol";
import {Ownable} from "./supportingContracts/RBAC.sol";
import {ReentrancyGuard} from "./supportingContracts/ReentrancyGuard.sol";

contract ConnectUsToken is ERC20, Ownable, ReentrancyGuard {
    uint256 public noOfUsers;
    uint256 public totalSupplyConnectUs = 0;

    uint256 public constant TOKEN_DECIMALS = 10 ** 18;
    uint256 public constant TOKENTOETH_RATE = 5000;

    constructor(uint256 initialSupply) ERC20("ConnectUs", "CKT") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply * TOKEN_DECIMALS); 
        noOfUsers = 0;
        totalSupplyConnectUs = initialSupply;
    }

    struct User {
        string email;
        uint256 noOfTokens;
        address add;
    }

    mapping (string => User) private Users;
    mapping (string => bool) private existUser;

    // Events
    event UserCreated(string indexed email, address userAddress);
    event TokenTransferred(string indexed email, address to, uint256 amount);
    event TokenWithdrawn(string indexed email, address to, uint256 tokenAmount, uint256 ethAmount);

    function createUser(string memory email, address add) public onlyOwner returns (bool) {
        require(!existUser[email], "User already exists");
        Users[email] = User(email, 0, add);
        existUser[email] = true;
        noOfUsers++;

        emit UserCreated(email, add);
        return true;
    }

    function mint(address account, uint256 amount) public onlyOwner returns (bool) {
        require(account != address(this) && amount != 0, "ERC20: Invalid mint");
        _mint(account, amount * TOKEN_DECIMALS);
        return true;
    }

    function burn(address account, uint256 amount) public onlyOwner returns (bool) {
        require(account != address(this) && amount != 0, "ERC20: Invalid burn");
        _burn(account, amount * TOKEN_DECIMALS);
        return true;
    }

    function transferClient(string memory email) public onlyOwner nonReentrant returns (bool) {
        require(existUser[email], "User does not exist");

        address client = Users[email].add;
        uint256 amount = 1 * TOKEN_DECIMALS;
        if(totalSupplyConnectUs <= 10){
            mint(owner(), 2000);
            totalSupplyConnectUs += 2000;
        }
        _transfer(owner(), client, amount);
        Users[email].noOfTokens += 1;
        totalSupplyConnectUs -= 1;

        emit TokenTransferred(email, client, amount);
        return true;
    }

    function withdraw(uint256 tokenAmount, string memory email) public onlyOwner nonReentrant returns (bool) {
        require(existUser[email], "User does not exist");
        require(tokenAmount <= Users[email].noOfTokens, "Withdraw: Insufficient token balance");

        uint256 ethAmount = tokenAmount * TOKENTOETH_RATE;
        require(address(this).balance >= ethAmount, "Contract doesn't have enough ETH");

        Users[email].noOfTokens -= tokenAmount;

        _burn(Users[email].add, tokenAmount * TOKEN_DECIMALS);
        payable(Users[email].add).transfer(ethAmount);

        emit TokenWithdrawn(email, Users[email].add, tokenAmount, ethAmount);
        return true;
    }

    function donateMoney()public payable nonReentrant returns(bool){
        require(msg.value > 0,"Give a valid amount");
        return true;
    }

    function getTokenBalance(string memory email) public view returns (uint256) {
        require(existUser[email], "User does not exist");
        return Users[email].noOfTokens;
    }

    // For receving ETH from external sources
    receive() external payable { }
}
