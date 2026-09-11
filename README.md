# Coin Crafter Hub

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MemecoinFactory
/// @notice Single contract that lets users create memecoins, clone existing ones for a fee,
///         transfer balances, and read holder/supply data. No separate ERC20 deployments —
///         every coin's balances live inside this contract's storage.
contract MemecoinFactory {
    struct Memecoin {
        string name;
        string symbol;
        uint256 totalSupply;
        string image;        // ipfs:// URI
        string description;
        string twitter;
        string github;
        address creator;
        uint256 clonedFrom;  // 0 if this is an original coin
        uint256 createdAt;
    }

    uint256 public nextCoinId = 1;
    uint256 public cloneFee = 0.001 ether;
    address public owner;

    mapping(uint256 => Memecoin) public coins;
    mapping(uint256 => mapping(address => uint256)) public balanceOf;
    mapping(uint256 => mapping(address => bool)) private isHolder;
    mapping(uint256 => uint256) public holderCount;
    mapping(uint256 => uint256) public cloneCount;
    mapping(address => uint256[]) private userCoins;
    uint256[] private allCoinIds;

    event MemecoinCreated(uint256 indexed coinId, address indexed creator, string name, string symbol);
    event MemecoinCloned(uint256 indexed originalId, uint256 indexed newCoinId, address indexed cloner);
    event Transfer(uint256 indexed coinId, address indexed from, address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ---------------------------------------------------------------
    // Create
    // ---------------------------------------------------------------

    function createMemecoin(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        string memory _image,
        string memory _description,
        string memory _twitter,
        string memory _github
    ) external returns (uint256) {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_symbol).length > 0, "Symbol required");
        require(_totalSupply > 0, "Supply must be > 0");

        uint256 coinId = nextCoinId++;

        coins[coinId] = Memecoin({
            name: _name,
            symbol: _symbol,
            totalSupply: _totalSupply,
            image: _image,
            description: _description,
            twitter: _twitter,
            github: _github,
            creator: msg.sender,
            clonedFrom: 0,
            createdAt: block.timestamp
        });

        balanceOf[coinId][msg.sender] = _totalSupply;
        _addHolder(coinId, msg.sender);
        _trackUserCoin(msg.sender, coinId);
        allCoinIds.push(coinId);

        emit MemecoinCreated(coinId, msg.sender, _name, _symbol);
        emit Transfer(coinId, address(0), msg.sender, _totalSupply);

        return coinId;
    }

    // ---------------------------------------------------------------
    // Clone (pay a fee to fork an existing coin's image/description)
    // ---------------------------------------------------------------

    function cloneMemecoin(
        uint256 _originalCoinId,
        string memory _newName,
        string memory _newSymbol
    ) external payable returns (uint256) {
        require(msg.value >= cloneFee, "Insufficient clone fee");
        require(coins[_originalCoinId].creator != address(0), "Original coin doesn't exist");
        require(bytes(_newName).length > 0, "Name required");
        require(bytes(_newSymbol).length > 0, "Symbol required");

        Memecoin memory original = coins[_originalCoinId];
        uint256 coinId = nextCoinId++;

        coins[coinId] = Memecoin({
            name: _newName,
            symbol: _newSymbol,
            totalSupply: original.totalSupply,
            image: original.image,
            description: original.description,
            twitter: original.twitter,
            github: original.github,
            creator: msg.sender,
            clonedFrom: _originalCoinId,
            createdAt: block.timestamp
        });

        balanceOf[coinId][msg.sender] = original.totalSupply;
        _addHolder(coinId, msg.sender);
        _trackUserCoin(msg.sender, coinId);
        allCoinIds.push(coinId);
        cloneCount[_originalCoinId] += 1;

        (bool sent, ) = owner.call{value: msg.value}("");
        require(sent, "Fee transfer failed");

        emit MemecoinCreated(coinId, msg.sender, _newName, _newSymbol);
        emit Transfer(coinId, address(0), msg.sender, original.totalSupply);
        emit MemecoinCloned(_originalCoinId, coinId, msg.sender);

        return coinId;
    }

    // ---------------------------------------------------------------
    // Transfer / Send
    // ---------------------------------------------------------------

    function transfer(uint256 _coinId, address _to, uint256 _amount) external returns (bool) {
        require(_to != address(0), "Cannot send to zero address");
        require(coins[_coinId].creator != address(0), "Coin doesn't exist");
        require(balanceOf[_coinId][msg.sender] >= _amount, "Insufficient balance");

        balanceOf[_coinId][msg.sender] -= _amount;
        balanceOf[_coinId][_to] += _amount;

        if (balanceOf[_coinId][msg.sender] == 0) {
            _removeHolder(_coinId, msg.sender);
        }
        _addHolder(_coinId, _to);
        _trackUserCoin(_to, _coinId);

        emit Transfer(_coinId, msg.sender, _to, _amount);
        return true;
    }

    // ---------------------------------------------------------------
    // Internal helpers
    // ---------------------------------------------------------------

    function _addHolder(uint256 _coinId, address _holder) private {
        if (!isHolder[_coinId][_holder]) {
            isHolder[_coinId][_holder] = true;
            holderCount[_coinId] += 1;
        }
    }

    function _removeHolder(uint256 _coinId, address _holder) private {
        if (isHolder[_coinId][_holder]) {
            isHolder[_coinId][_holder] = false;
            holderCount[_coinId] -= 1;
        }
    }

    /// @dev O(n) scan over the user's existing coin list to avoid duplicates.
    ///      Fine for hackathon-scale usage; swap for off-chain indexing if a
    ///      user ends up holding a very large number of distinct coins.
    function _trackUserCoin(address _user, uint256 _coinId) private {
        uint256[] storage list = userCoins[_user];
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == _coinId) return;
        }
        list.push(_coinId);
    }

    // ---------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------

    function getCoin(uint256 _coinId) external view returns (Memecoin memory) {
        return coins[_coinId];
    }

    /// @notice All coin IDs ever created (originals and clones).
    function getAllCoinIds() external view returns (uint256[] memory) {
        return allCoinIds;
    }

    /// @notice Every coin ID a given address currently holds or has ever held/created.
    ///         Filter client-side by balanceOf() > 0 to show only current holdings.
    function getUserCoins(address _user) external view returns (uint256[] memory) {
        return userCoins[_user];
    }

    function getBalance(uint256 _coinId, address _user) external view returns (uint256) {
        return balanceOf[_coinId][_user];
    }

    // ---------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------

    function setCloneFee(uint256 _newFee) external onlyOwner {
        cloneFee = _newFee;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Zero address");
        owner = _newOwner;
    }
}
this is the solidity contract i am pasting this and attachn the screenshot make this webiste sma eMemecoin Creator on BOT Chain — Project Documentation

1. Overview

A web app where users connect a wallet, create their own memecoin (name, symbol, supply, image, description, socials), browse and hold coins created by others, send coins to other wallets, and clone an existing coin (paying a small fee) to fork its image/description under a new name. All coin data (balances, supply, holders) lives inside a single on-chain contract, MemecoinFactory.sol, deployed on BOT Chain testnet. Images and long-form metadata live on IPFS.

2. Tech stack

Layer Choice Contract Solidity, MemecoinFactory.sol, single-contract design Chain BOT Chain testnet (EVM-compatible, MetaMask-ready) Storage IPFS (Pinata) for coin images and descriptions Indexer Node.js + ethers.js reading Transfer/MemecoinCreated events into a database, powering holder counts and "my coins" lookups Frontend Next.js + ethers.js/viem + Tailwind Wallet MetaMask, configured with BOT Chain testnet RPC

3. Pages and UI elements

3.1 Explore page (home)

The landing page. Shows every memecoin ever created, newest first.

Connect wallet button (top right) — opens MetaMask, switches to BOT Chain testnet if not already selected.

Create coin button (top right, primary CTA) — navigates to the Create page.

Search bar — filters the grid by name or symbol.

Sort dropdown — Newest, Most holders, Most cloned.

Coin card (repeated grid item) — image thumbnail, name, symbol, holder count badge, clone count badge if original. Clicking a card opens that coin's detail page.

3.2 Create memecoin page

A form for minting a new coin.

Name — text input.

Symbol — text input, short ticker (e.g. DOGE).

Total supply — number input.

Image upload — file picker, uploads to IPFS on selection, shows a preview.

Description — textarea.

Twitter link — text input (optional).

GitHub link — text input (optional).

Create coin button — disabled until required fields are valid; on click, uploads image + metadata JSON to IPFS, then calls createMemecoin(...) on the contract and prompts a MetaMask confirmation. On success, redirects to the new coin's detail page.

Cancel button — returns to Explore.

3.3 Coin detail page

Everything about one coin.

Image (large, top).

Name / Symbol header.

Description text block.

Total supply stat.

Holder count stat.

Creator address (shortened, e.g. 0x1a2b...9f3c) with a Copy icon button.

Twitter icon/link — opens the stored URL in a new tab. Hidden if not set.

GitHub icon/link — same as above.

"Cloned from [original name]" badge — shown only if this coin has clonedFrom != 0; clicking it navigates to the original coin's detail page.

"N clones" badge — shown only on originals with cloneCount > 0; clicking it opens a list of coins cloned from this one.

Send button — opens the Send modal.

Clone button — opens the Clone modal.

View on explorer button — opens the BOT Chain block explorer for this contract's transactions, if the chain has one available.

3.4 Send modal

Triggered from the Send button on a coin detail page (or from a row in My coins).

Recipient address — text input, validated as a proper address.

Amount — number input.

Max button — fills the amount field with the connected wallet's full balance of that coin.

Send button — calls transfer(coinId, to, amount), prompts MetaMask, shows a pending spinner, then a success/failure toast.

Cancel button — closes the modal without doing anything.

3.5 Clone modal

Triggered from the Clone button on a coin detail page.

New name — text input.

New symbol — text input.

Clone fee — read-only display of the current fee (from cloneFee).

Confirm & pay fee button — calls cloneMemecoin(originalCoinId, newName, newSymbol) with value: cloneFee, prompts MetaMask, shows pending/success states, then redirects to the new clone's detail page.

Cancel button — closes the modal.

3.6 My coins page

Shown once a wallet is connected; accessible from a nav link or wallet menu.

Tabs: "Holding" (any coin with balance > 0, whether created, cloned, or received) and "Created" (coins this address created or cloned).

Coin row — thumbnail, name, symbol, balance held. Clicking a row opens that coin's detail page.

Send button per row — opens the Send modal pre-filled with that coin.

This is also what answers your "another account opens the app and sees coins sent to them" requirement: the Holding tab is driven by the indexer's balances table, which updates on every Transfer event regardless of whether the receiving address ever created anything itself.

4. System flows

4.1 Create flow

User connects wallet.

User opens Create page, fills form, uploads image.

Frontend uploads image + JSON metadata to IPFS, gets back a URI.

Frontend calls createMemecoin(...) with that URI.

MetaMask prompts for confirmation; user approves.

Transaction confirms on BOT Chain; contract emits MemecoinCreated and Transfer(0x0 → creator, totalSupply).

Indexer picks up both events, writes the coin row and initial balance row.

Frontend redirects to the new coin's detail page.

4.2 Browse / view flow

Explore page requests the coin list from the indexer API (or directly from getAllCoinIds() + getCoin() calls as a fallback).

User clicks a card.

Detail page loads that coin's data plus holderCount and cloneCount directly from the contract, and image/description from IPFS via the stored URI.

4.3 Send flow

User opens a coin detail page (or My coins row) and clicks Send.

Modal collects recipient + amount.

Frontend calls transfer(coinId, to, amount).

MetaMask prompts; user approves.

Contract updates both balances, updates holder flags, emits Transfer.

Indexer updates the balances table for both addresses.

If the recipient later connects their own wallet, the coin now appears in their My coins → Holding tab.

4.4 Clone flow

User opens an existing coin's detail page and clicks Clone.

Modal collects new name/symbol and shows the required fee.

Frontend calls cloneMemecoin(originalCoinId, newName, newSymbol) with the fee attached as msg.value.

MetaMask prompts; user approves and pays the fee.

Contract deploys the clone's data (same image/description, new name/symbol), assigns full supply to the cloner, transfers the fee to owner, emits MemecoinCreated and MemecoinCloned.

Indexer records the new coin and increments the original's clone count.

Frontend redirects to the new clone's detail page, which shows the "Cloned from" badge linking back to the original.

4.5 Multi-account flow

Account A creates or holds a coin, or sends some of it to Account B.

Account B connects their own wallet in a separate session.

My coins → Holding tab queries the indexer for all coins where balances[token][accountB] > 0.

Any coin Account B has received — even if they never created anything themselves — appears in that list with the correct balance.

5. UI button → contract function map

Button Contract function Create coin (Create page) createMemecoin(name, symbol, supply, image, description, twitter, github) Confirm & pay fee (Clone modal) cloneMemecoin(originalCoinId, newName, newSymbol) payable Send (Send modal) transfer(coinId, to, amount) Coin detail page load getCoin(coinId), holderCount(coinId), cloneCount(coinId) My coins page load getUserCoins(address) + getBalance(coinId, address) (or indexer equivalents) Set clone fee (admin only) setCloneFee(newFee)

6. Data: on-chain vs off-chain

Data Stored where Name, symbol, supply, balances On-chain (MemecoinFactory.sol) Creator, cloned-from lineage On-chain Holder count, clone count On-chain, updated automatically Image, description, socials IPFS, referenced by URI stored on-chain Fast coin listing, "my coins" lookup, holder history Indexer database (derived from on-chain events, for fast reads) ake thw ebiste ame as look like scrrenshot ensure no any mockup data and there should be botchain testnet in this use wagmi library in this:


export const botchain = defineChain({

  id: 968,

  name: 'BOT Chain tesnet',

  nativeCurrency: { name: 'tBOT', symbol: 'tBOT', decimals: 18 },

  rpcUrls: { default: { http: ['https://rpc.bohr.life'], webSocket: ['https://rpc.bohr.life'] } },

  blockExplorers: { default: { name: 'Botscan', url: 'https://scan.botchain.ai' } },

})

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://memecoin-mixer.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6b7b6d69-d50a-4da6-91bd-e4234e800640).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
#   B o t D e r p - A - M e m C o i n - F a c t o r y - o n - B o t C h a i n  
 