# n8n-nodes-corda

> [Velocity BPA Licensing Notice]
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

Enterprise-grade n8n community node for R3 Corda distributed ledger platform. Automate operations with Corda blockchain networks directly from your n8n workflows - connect to nodes, query vault states, execute flows, manage tokens, handle accounts, and integrate enterprise blockchain into your automation pipelines.

![n8n.io - Workflow Automation](https://img.shields.io/badge/n8n-community%20node-ff6d5a)
![Corda](https://img.shields.io/badge/Corda-4.x%20%7C%205.x-EC1D27)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)

---

## Features

### 19 Resource Categories with 180+ Operations

| Resource | Operations | Description |
|----------|------------|-------------|
| **Node** | 10 | Node info, diagnostics, health checks |
| **Identity** | 14 | Party resolution, identity management |
| **Vault** | 17 | State queries, pagination, filtering |
| **Transaction** | 16 | Flow execution, transaction inspection |
| **Flow** | 14 | Flow lifecycle, hospital queue management |
| **State** | 11 | State inspection, history, tracking |
| **Contract** | 8 | Contract info, constraints, upgrades |
| **Attachment** | 11 | Upload, download, query attachments |
| **Token** | 16 | Token SDK - issue, move, redeem tokens |
| **Account** | 15 | Accounts SDK - sub-identity management |
| **Confidential Identity** | 8 | Anonymous transaction parties |
| **Notary** | 9 | Notary services and health |
| **Time Window** | 7 | Transaction validity periods |
| **Network Map** | 10 | Network participant discovery |
| **Scheduler** | 5 | Scheduled state activities |
| **Observer** | 8 | Real-time observable feeds |
| **Business Network** | 11 | BNO membership management |
| **Corda 5** | 18 | REST API for Corda 5.x |
| **Utility** | 10 | Hashing, parsing, connection testing |

### Trigger Node for Real-Time Events

- Vault state updates (produced, consumed)
- Transaction events (recorded, verified, failed)
- Flow lifecycle events (started, completed, hospitalized)
- Network map changes
- Token and account events

---

## Installation

### Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** → **Community Nodes**
3. Click **Install a community node**
4. Enter: `n8n-nodes-corda`
5. Click **Install**

### Manual Installation

```bash
cd ~/.n8n
npm install n8n-nodes-corda
n8n start
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-corda.git
cd n8n-nodes-corda

# Install dependencies
npm install

# Build the project
npm run build

# Link to n8n
npm link
cd ~/.n8n
npm link n8n-nodes-corda
```

---

## Credentials Setup

### Corda Node Credentials (Corda 4.x)

| Field | Description | Example |
|-------|-------------|---------|
| **Corda Version** | Select your Corda version | `Corda 4.x Enterprise` |
| **RPC Host** | Node RPC hostname | `localhost` |
| **RPC Port** | Node RPC port | `10006` |
| **RPC Username** | RPC authentication username | `user1` |
| **RPC Password** | RPC authentication password | `password` |
| **SSL Enabled** | Enable SSL/TLS | `true` |
| **Trust Store Path** | Path to SSL trust store | `/path/to/truststore.jks` |
| **Trust Store Password** | Trust store password | `changeit` |

### Corda 5 REST API Credentials

| Field | Description | Example |
|-------|-------------|---------|
| **REST API URL** | Corda 5 REST endpoint | `https://corda5.example.com:8888` |
| **Username** | API username | `admin` |
| **Password** | API password | `password` |
| **Virtual Node ID** | Short hash of virtual node | `ABC123DEF456` |

---

## Resources & Operations

### Node Resource
- Get Node Info, Get Node Time, Get Network Parameters, Get Notary Identities
- Get Network Map Snapshot, Get Platform Version, Get Registered Flows
- Get Node Diagnostic Info, Clear Network Map Cache, Test Connection

### Vault Resource
- Query Vault (linear/unconsumed/consumed/all), Query by Contract Type
- Query by Notary, Query by Participants, Query by Time Window
- Query by External ID, Query with Pagination, Query with Sorting
- Get State by Ref, Track Vault Updates, Get Soft Locked States

### Transaction Resource
- Start Flow, Start Flow with Client ID, Get Flow Outcome
- Track Flow Progress, Kill Flow, Get Running Flows
- Get Transaction, Verify Transaction, Get Transaction History

### Token Resource (Token SDK)
- Issue Tokens, Move Tokens, Redeem Tokens, Get Token Balance
- Query Tokens by Type/Holder/Issuer, Get Fungible/Non-Fungible States
- Create/Update Evolvable Token Type, Hold/Release Tokens

### Account Resource (Accounts SDK)
- Create Account, Get Account Info, Get All Accounts
- Share Account Info, Request Account Info, Move Account
- Get Account Balance, Get Account States, Query by Account

---

## Trigger Node

The **Corda Trigger** node subscribes to real-time events:

| Event Type | Description |
|------------|-------------|
| State Produced | New state added to vault |
| State Consumed | State consumed in transaction |
| Transaction Recorded | Transaction finalized |
| Flow Started | Flow initiated |
| Flow Completed | Flow finished successfully |
| Flow Failed | Flow encountered error |
| Network Map Updated | Network participants changed |

---

## Usage Examples

### Query Vault States

```
Resource: Vault
Operation: Query Vault
Contract State Type: com.example.states.IOUState
State Status: Unconsumed
Page Size: 100
```

### Start a Flow

```
Resource: Transaction
Operation: Start Flow
Flow Class: com.example.flows.CreateIOUFlow
Flow Arguments: {"amount": 100, "lender": "O=PartyB, L=London, C=GB"}
Wait for Completion: true
Timeout: 60000
```

### Issue Tokens (Token SDK)

```
Resource: Token
Operation: Issue Tokens
Token Type: USD
Amount: 1000
Holder: O=PartyA, L=New York, C=US
Notary: O=Notary, L=London, C=GB
```

### Create Account (Accounts SDK)

```
Resource: Account
Operation: Create Account
Account Name: trading-desk-1
```

---

## Corda Concepts

| Concept | Description |
|---------|-------------|
| **States** | Immutable data objects representing facts on the ledger |
| **Transactions** | State transitions that consume inputs and produce outputs |
| **Contracts** | Rules that validate transaction correctness |
| **Flows** | Multi-party transaction orchestration protocols |
| **Notary** | Consensus service preventing double-spending |
| **Vault** | Database of known states owned by the node |
| **X.500 Name** | Legal identity format (O=Org, L=City, C=Country) |
| **StateRef** | Reference to a state (txHash:index) |

---

## Networks

| Network | Support |
|---------|---------|
| Corda 4.x Open Source | ✅ Full |
| Corda 4.x Enterprise | ✅ Full |
| Corda 5.x | ✅ Full (REST API) |

---

## Error Handling

The node provides detailed error messages for common issues:

- **Connection Errors**: RPC host unreachable, invalid credentials
- **Flow Errors**: Flow not found, invalid arguments, timeout
- **Vault Errors**: Invalid query criteria, state not found
- **Token Errors**: Insufficient balance, invalid token type

---

## Security Best Practices

- **Credentials**: All RPC credentials are encrypted at rest by n8n
- **SSL/TLS**: Enable SSL for production deployments
- **Permissions**: Use RPC users with appropriate flow permissions
- **Confidential Identities**: Use for transaction privacy requirements
- **Attachments**: Validate content before processing

---

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- n8n >= 1.0.0

### Commands

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run linting
npm run lint
npm run lint:fix

# Run tests
npm test
npm run test:coverage
```

### Scripts

```bash
# Run full test suite
./scripts/test.sh

# Build the project
./scripts/build.sh

# Install locally for testing
./scripts/install-local.sh
```

---

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

---

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-corda/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Velocity-BPA/n8n-nodes-corda/discussions)
- **Commercial Licensing**: [licensing@velobpa.com](mailto:licensing@velobpa.com)

---

## Acknowledgments

- [R3 Corda](https://corda.net) - Enterprise blockchain platform
- [n8n](https://n8n.io) - Workflow automation platform
- The Corda developer community
