// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 
 * @dev ERC1155 合约，包含官方认证 NFT 与学生自铸个人 NFT，支持盲盒稀有度、保底与每日限额。
 */
contract GraduationNFT is ERC1155, ERC1155Burnable, ERC1155Supply, AccessControl {
    using Strings for uint256;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public constant DIPLOMA = 1;
    uint256 public constant MEMORIAL_BADGE = 2;
    uint256 public constant HONOR_CERTIFICATE = 3;
    uint256 public constant SPECIAL_AWARD = 4;

    uint256 public nextPersonalTokenId = 10001;

    enum Rarity { 
        COMMON,
        RARE,
        LEGENDARY
    }

    uint256 public constant COMMON_RATE = 700;
    uint256 public constant RARE_RATE = 250;
    uint256 public constant LEGENDARY_RATE = 50;

    uint256 public constant PITY_COUNT = 20;

    string public name;
    string public symbol;
    string private _baseURI;

    string public universityName;

    /// @notice 毕业生档案
    struct Graduate {
        string studentId;
        string studentName;
        string major;
        string college;
        uint256 mintedAt;
        bool hasClaimed;
        uint256 selfMintCount;
        uint256 pityCounter;
    }

    /// @notice 个人纪念 NFT 链上元数据
    struct PersonalNFTData {
        address owner;
        Rarity rarity;
        uint256 mintTime;
        uint256 colorSeed;
        uint256 mintNumber;
    }

    mapping(address => Graduate) public graduates;
    mapping(string => address) public studentIdToAddress;
    address[] public graduateAddresses;

    mapping(uint256 => PersonalNFTData) public personalNFTs;
    uint256 public totalPersonalMinted;

    mapping(uint256 => uint256) public maxSupply;
    mapping(uint256 => string) private _tokenURIs;

    uint256 public constant DAILY_MINT_LIMIT = 5;
    mapping(address => uint256) public dailyMintCount;
    mapping(address => uint256) public lastMintDay;

    uint256 private _randomNonce;

    event GraduateRegistered(address indexed graduate, string studentId, string studentName);
    event OfficialNFTMinted(address indexed to, uint256 indexed tokenId, string nftType);
    event PersonalNFTMinted(
        address indexed to, 
        uint256 indexed tokenId, 
        Rarity rarity, 
        uint256 colorSeed,
        uint256 mintNumber
    );
    event BatchMinted(address[] recipients, uint256 indexed tokenId);

    /// @notice 初始化合约，设置名称/URI并授权部署者
    constructor(
        string memory _universityName,
        string memory baseURI_
    ) ERC1155(baseURI_) {
        name = string(abi.encodePacked(_universityName, " Graduation NFT"));
        symbol = "GRADNFT";
        universityName = _universityName;
        _baseURI = baseURI_;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        maxSupply[DIPLOMA] = 10000;
        maxSupply[MEMORIAL_BADGE] = 10000;
        maxSupply[HONOR_CERTIFICATE] = 1000;
        maxSupply[SPECIAL_AWARD] = 100;
    }

    /// @notice 注册单个毕业生
    function registerGraduate(
        address graduateAddress,
        string memory studentId,
        string memory studentName,
        string memory major,
        string memory college
    ) external onlyRole(ADMIN_ROLE) {
        require(graduateAddress != address(0), "Invalid address");
        require(bytes(studentId).length > 0, "Student ID required");
        require(bytes(graduates[graduateAddress].studentId).length == 0, "Already registered");
        require(studentIdToAddress[studentId] == address(0), "Student ID already used");

        graduates[graduateAddress] = Graduate({
            studentId: studentId,
            studentName: studentName,
            major: major,
            college: college,
            mintedAt: 0,
            hasClaimed: false,
            selfMintCount: 0,
            pityCounter: 0
        });

        studentIdToAddress[studentId] = graduateAddress;
        graduateAddresses.push(graduateAddress);
        emit GraduateRegistered(graduateAddress, studentId, studentName);
    }

    /// @notice 批量注册毕业生（长度需一致，不回滚单个失败）
    function batchRegisterGraduates(
        address[] memory addresses,
        string[] memory studentIds,
        string[] memory studentNames,
        string[] memory majors,
        string[] memory colleges
    ) external onlyRole(ADMIN_ROLE) {
        require(
            addresses.length == studentIds.length &&
            addresses.length == studentNames.length &&
            addresses.length == majors.length &&
            addresses.length == colleges.length,
            "Array lengths mismatch"
        );

        for (uint256 i = 0; i < addresses.length; i++) {
            if (bytes(graduates[addresses[i]].studentId).length > 0 || 
                studentIdToAddress[studentIds[i]] != address(0)) {
                continue;
            }

            graduates[addresses[i]] = Graduate({
                studentId: studentIds[i],
                studentName: studentNames[i],
                major: majors[i],
                college: colleges[i],
                mintedAt: 0,
                hasClaimed: false,
                selfMintCount: 0,
                pityCounter: 0
            });

            studentIdToAddress[studentIds[i]] = addresses[i];
            graduateAddresses.push(addresses[i]);
            emit GraduateRegistered(addresses[i], studentIds[i], studentNames[i]);
        }
    }

    /// @notice 给已注册学生发放单个官方 NFT（防重复、限供应）
    function mintOfficialNFT(
        address to,
        uint256 tokenId
    ) external onlyRole(MINTER_ROLE) {
        require(bytes(graduates[to].studentId).length > 0, "Graduate not registered");
        require(tokenId >= 1 && tokenId <= 4, "Invalid official NFT type");
        require(totalSupply(tokenId) < maxSupply[tokenId], "Max supply reached");
        require(balanceOf(to, tokenId) == 0, "Already owns this NFT");

        _mint(to, tokenId, 1, "");
        if (!graduates[to].hasClaimed) {
            graduates[to].hasClaimed = true;
            graduates[to].mintedAt = block.timestamp;
        }

        string memory nftType;
        if (tokenId == DIPLOMA) nftType = "Diploma";
        else if (tokenId == MEMORIAL_BADGE) nftType = "Memorial Badge";
        else if (tokenId == HONOR_CERTIFICATE) nftType = "Honor Certificate";
        else nftType = "Special Award";

        emit OfficialNFTMinted(to, tokenId, nftType);
    }

    /// @notice 批量发放同一种官方 NFT，跳过未注册或已持有者
    function batchMintOfficial(
        address[] memory recipients,
        uint256 tokenId
    ) external onlyRole(MINTER_ROLE) {
        require(tokenId >= 1 && tokenId <= 4, "Invalid official NFT type");
        require(totalSupply(tokenId) + recipients.length <= maxSupply[tokenId], "Would exceed max supply");

        for (uint256 i = 0; i < recipients.length; i++) {
            if (bytes(graduates[recipients[i]].studentId).length == 0) continue;
            if (balanceOf(recipients[i], tokenId) > 0) continue;
            _mint(recipients[i], tokenId, 1, "");
            if (!graduates[recipients[i]].hasClaimed) {
                graduates[recipients[i]].hasClaimed = true;
                graduates[recipients[i]].mintedAt = block.timestamp;
            }
        }

        emit BatchMinted(recipients, tokenId);
    }

    /// @notice 学生自铸个人 NFT，含盲盒、保底与每日限额
    function mintPersonalNFT() external returns (uint256) {
        require(bytes(graduates[msg.sender].studentId).length > 0, "Not registered as graduate");
        uint256 today = block.timestamp / 1 days;
        if (lastMintDay[msg.sender] != today) {
            dailyMintCount[msg.sender] = 0;
            lastMintDay[msg.sender] = today;
        }
        require(dailyMintCount[msg.sender] < DAILY_MINT_LIMIT, "Daily mint limit reached");

        graduates[msg.sender].pityCounter++;
        Rarity rarity;
        
        if (graduates[msg.sender].pityCounter >= PITY_COUNT) {
            uint256 pityRandom = _generateRandom(100);
            if (pityRandom < 20) {
                rarity = Rarity.LEGENDARY;
            } else {
                rarity = Rarity.RARE;
            }
            graduates[msg.sender].pityCounter = 0;
        } else {
            uint256 random = _generateRandom(1000);
            if (random < LEGENDARY_RATE) {
                rarity = Rarity.LEGENDARY;
                graduates[msg.sender].pityCounter = 0;
            } else if (random < LEGENDARY_RATE + RARE_RATE) {
                rarity = Rarity.RARE;
                graduates[msg.sender].pityCounter = 0;
            } else {
                rarity = Rarity.COMMON;
            }
        }

        uint256 colorSeed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            nextPersonalTokenId,
            totalPersonalMinted
        )));

        uint256 tokenId = nextPersonalTokenId;
        nextPersonalTokenId++;
        totalPersonalMinted++;

        personalNFTs[tokenId] = PersonalNFTData({
            owner: msg.sender,
            rarity: rarity,
            mintTime: block.timestamp,
            colorSeed: colorSeed,
            mintNumber: totalPersonalMinted
        });

        _mint(msg.sender, tokenId, 1, "");
        graduates[msg.sender].selfMintCount++;
        dailyMintCount[msg.sender]++;
        emit PersonalNFTMinted(msg.sender, tokenId, rarity, colorSeed, totalPersonalMinted);

        return tokenId;
    }

    /// @dev 基于区块信息与 nonce 的轻量伪随机数
    function _generateRandom(uint256 max) private returns (uint256) {
        _randomNonce++;
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            _randomNonce
        ))) % max;
    }

    /// @notice 查询用户今日剩余可铸次数
    function getRemainingDailyMints(address student) external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        if (lastMintDay[student] != today) return DAILY_MINT_LIMIT;
        return DAILY_MINT_LIMIT - dailyMintCount[student];
    }

    /// @notice 查询用户当前保底计数
    function getPityCounter(address student) external view returns (uint256) {
        return graduates[student].pityCounter;
    }

    /// @notice 已注册毕业生总数
    function getTotalGraduates() external view returns (uint256) {
        return graduateAddresses.length;
    }

    /// @notice 查询毕业生档案
    function getGraduateInfo(address graduateAddress) external view returns (
        string memory studentId,
        string memory studentName,
        string memory major,
        string memory college,
        uint256 mintedAt,
        bool hasClaimed,
        uint256 selfMintCount,
        uint256 pityCounter
    ) {
        Graduate memory grad = graduates[graduateAddress];
        return (
            grad.studentId,
            grad.studentName,
            grad.major,
            grad.college,
            grad.mintedAt,
            grad.hasClaimed,
            grad.selfMintCount,
            grad.pityCounter
        );
    }

    /// @notice 查询个人 NFT 元数据
    function getPersonalNFTData(uint256 tokenId) external view returns (
        address owner,
        uint8 rarity,
        uint256 mintTime,
        uint256 colorSeed,
        uint256 mintNumber
    ) {
        PersonalNFTData memory data = personalNFTs[tokenId];
        return (
            data.owner,
            uint8(data.rarity),
            data.mintTime,
            data.colorSeed,
            data.mintNumber
        );
    }

    /// @notice 地址是否已注册毕业生
    function isRegisteredGraduate(address addr) external view returns (bool) {
        return bytes(graduates[addr].studentId).length > 0;
    }

    /// @notice Token 是否官方 NFT (1-4)
    function isOfficialNFT(uint256 tokenId) public pure returns (bool) {
        return tokenId >= 1 && tokenId <= 4;
    }

    /// @notice Token 是否个人 NFT (>=10001)
    function isPersonalNFT(uint256 tokenId) public pure returns (bool) {
        return tokenId >= 10001;
    }

    /// @notice Token 类型名称
    function getNFTTypeName(uint256 tokenId) external pure returns (string memory) {
        if (tokenId == DIPLOMA) return "Diploma";
        if (tokenId == MEMORIAL_BADGE) return "Memorial Badge";
        if (tokenId == HONOR_CERTIFICATE) return "Honor Certificate";
        if (tokenId == SPECIAL_AWARD) return "Special Award";
        if (tokenId >= 10001) return "Personal Memorial";
        return "Unknown";
    }

    /// @notice 设置特定 Token 自定义 URI
    function setTokenURI(uint256 tokenId, string memory tokenURI_) external onlyRole(ADMIN_ROLE) {
        _tokenURIs[tokenId] = tokenURI_;
    }

    /// @notice 更新基础 URI
    function setBaseURI(string memory baseURI_) external onlyRole(ADMIN_ROLE) {
        _baseURI = baseURI_;
    }

    /// @notice 调整官方 NFT 最大供应量（不得低于已铸数量）
    function setMaxSupply(uint256 tokenId, uint256 _maxSupply) external onlyRole(ADMIN_ROLE) {
        require(_maxSupply >= totalSupply(tokenId), "Cannot set below current supply");
        maxSupply[tokenId] = _maxSupply;
    }

    /// @notice ERC1155 元数据 URI，优先返回自定义值
    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory tokenURI = _tokenURIs[tokenId];
        if (bytes(tokenURI).length > 0) return tokenURI;
        return string(abi.encodePacked(_baseURI, tokenId.toString(), ".json"));
    }

    /// @notice 合约级元数据 URI
    function contractURI() public view returns (string memory) {
        return string(abi.encodePacked(_baseURI, "contract.json"));
    }

    /// @dev 继承链上的 _update 适配 Supply 擴展
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }

    /// @notice 接口支持声明 (ERC165)
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
