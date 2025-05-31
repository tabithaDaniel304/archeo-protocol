# Archeo Protocol - Permit Manager

A secure and flexible permit management system for the Archeo Protocol, enabling granular access control for contract function calls.

## Overview

The Permit Manager is a core component of the Archeo Protocol that provides a robust system for managing permissions and access control. It allows users to request, grant, and revoke permits for specific functions in target contracts, ensuring secure and controlled access to protocol features.

## Features

- 🔐 **Granular Access Control**: Manage permissions at the function level
- 📝 **Permit Request System**: Users can request permits for specific functions
- ✅ **Contract Owner Controls**: Secure grant and revoke operations
- 👥 **User Registration**: Track and manage user permissions
- 🛡️ **Security First**: Built with security best practices

## Smart Contract Functions

### User Operations

- `request-permit`: Request a permit to call a specific function
- `check-permit`: Verify if a user has permission to call a function

### Admin Operations

- `grant-permit`: Grant a permit to a user
- `revoke-permit`: Revoke a user's permit
- `has-permit`: Check if a user has a specific permit

## Getting Started

### Prerequisites

- [Clarinet](https://docs.hiro.so/clarinet/getting-started)
- [Node.js](https://nodejs.org/) (for testing)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-org/archeo-protocol.git
cd archeo-protocol
```

2. Install dependencies:

```bash
npm install
```

3. Start the local development environment:

```bash
clarinet start
```

### Running Tests

```bash
npm test
```

## Usage Example

```clarity
;; Request a permit
(contract-call? .permit-manager request-permit target-contract "function-name")

;; Check if you have a permit
(contract-call? .permit-manager check-permit target-contract "function-name")

;; Grant a permit (contract owner only)
(contract-call? .permit-manager grant-permit user target-contract "function-name")
```

## Error Codes

| Code                      | Description                          |
| ------------------------- | ------------------------------------ |
| ERR-NOT-CONTRACT-OWNER    | Caller is not the contract owner     |
| ERR-PERMIT-NOT-FOUND      | Requested permit does not exist      |
| ERR-PERMIT-ALREADY-EXISTS | Permit request already exists        |
| ERR-NOT-PERMITTED         | User does not have required permit   |
| ERR-USER-NOT-REGISTERED   | User is not registered in the system |

## Security

The Permit Manager implements several security measures:

- Contract owner verification for sensitive operations
- User registration requirement
- Clear separation between request and grant phases
- Comprehensive error handling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Project Link: [https://github.com/your-org/archeo-protocol](https://github.com/your-org/archeo-protocol)

## Acknowledgments

- [Hiro](https://www.hiro.so/) for the Clarity smart contract language
- [Stacks](https://www.stacks.co/) for the blockchain infrastructure
