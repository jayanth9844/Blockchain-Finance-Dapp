import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import DeFiLendingPoolABI from './contracts/DeFiLendingPool.json';

function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [depositAmount, setDepositAmount] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [totalEarned, setTotalEarned] = useState('0');
  const [totalRepayment, setTotalRepayment] = useState('0');
  const [currentLoan, setCurrentLoan] = useState('0');

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);

          const networkId = await web3Instance.eth.net.getId();
          const deployedNetwork = DeFiLendingPoolABI.networks[networkId];
          const contractInstance = new web3Instance.eth.Contract(
            DeFiLendingPoolABI.abi, 
            deployedNetwork && deployedNetwork.address
          );
          setContract(contractInstance);

          const accountBalance = await web3Instance.eth.getBalance(accounts[0]);
          setBalance(web3Instance.utils.fromWei(accountBalance, 'ether'));

          fetchCurrentLoan();
          fetchTotalEarned();
          fetchTotalRepayment();
        } catch (error) {
          console.error("Failed to connect wallet", error);
        }
      } else {
        console.log('Please install MetaMask!');
      }
    };

    initWeb3();
  }, []);

  const fetchCurrentLoan = async () => {
    try {
      const loan = await contract.methods.getUserLoan(account).call();
      setCurrentLoan(web3.utils.fromWei(loan, 'ether'));
    } catch (error) {
      console.error('Failed to fetch current loan:', error);
    }
  };

  const fetchTotalEarned = async () => {
    try {
      const earned = await contract.methods.calculateTotalEarned(account).call();
      setTotalEarned(web3.utils.fromWei(earned, 'ether'));
    } catch (error) {
      console.error('Failed to fetch total earned:', error);
    }
  };

  const fetchTotalRepayment = async () => {
    try {
      const repayment = await contract.methods.calculateTotalRepayment(account).call();
      setTotalRepayment(web3.utils.fromWei(repayment, 'ether'));
    } catch (error) {
      console.error('Failed to fetch total repayment:', error);
    }
  };

  const depositETH = async () => {
    try {
      await contract.methods.depositETH().send({
        from: account,
        value: web3.utils.toWei(depositAmount, 'ether')
      });
      alert('Deposit Successful!');
      setDepositAmount('');
      fetchTotalEarned();
    } catch (error) {
      console.error('Deposit failed:', error);
      alert(`Deposit failed: ${error.message}`);
    }
  };

  const withdrawETH = async () => {
    try {
      await contract.methods.withdrawETH(web3.utils.toWei(depositAmount, 'ether')).send({
        from: account
      });
      alert('Withdrawal Successful!');
      setDepositAmount('');
      fetchTotalEarned();
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert(`Withdrawal failed: ${error.message}`);
    }
  };

  const requestLoan = async () => {
    try {
      await contract.methods.requestLoan(web3.utils.toWei(loanAmount, 'ether')).send({
        from: account
      });
      alert('Loan Request Successful!');
      setLoanAmount('');
      fetchCurrentLoan();
      fetchTotalRepayment();
    } catch (error) {
      console.error('Loan request failed:', error);
      alert(`Loan request failed: ${error.message}`);
    }
  };

  const repayLoan = async () => {
    try {
      if (parseFloat(currentLoan) === 0) {
        alert('No active loan to repay');
        return;
      }
  
      const totalRepaymentWei = await contract.methods.calculateTotalRepayment(account).call();
      const totalRepaymentEth = web3.utils.fromWei(totalRepaymentWei, 'ether');
      
      const repaymentInput = prompt(
        `Current loan repayment amount is ${totalRepaymentEth} ETH. ` +
        'Enter the amount of ETH you want to repay (must be at least the total repayment amount):'
      );

      if (repaymentInput === null) return; 
      const repaymentAmountEth = parseFloat(repaymentInput);
      

      const repaymentAmountWei = web3.utils.toWei(repaymentInput, 'ether');
      const totalRepaymentAmountWei = await contract.methods.calculateTotalRepayment(account).call();
  
     
      if (repaymentAmountEth < parseFloat(web3.utils.fromWei(totalRepaymentAmountWei, 'ether'))) {
        alert('Repayment amount must be at least the total loan repayment amount');
        return;
      }
  
    
      await contract.methods.repayLoan().send({
        from: account,
        value: repaymentAmountWei,
        gas: 300000 
      });
      
      alert('Loan Repayment Successful!');
      fetchCurrentLoan();
      fetchTotalRepayment();
    } catch (error) {
      console.error('Loan repayment failed:', error);
      alert(`Loan repayment failed: ${error.message}`);
    }
  };

  return (
    <div className="container">
      <style>
        {`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            background: #000;
            color: #00ff00;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            padding: 1rem;
          }
          .container {
            max-width: 600px;
            width: 100%;
            background: #111;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 0 20px #00ff00;
            border: 2px solid #00ff00;
          }
          header {
            text-align: center;
            margin-bottom: 2rem;
          }
          header h1 {
            font-size: 2rem;
            text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00;
          }
          .highlight {
            color: #00ff00;
            text-shadow: 0 0 10px #00ff00;
          }
          .actions {
            margin-bottom: 2rem;
          }
          .actions h2 {
            font-size: 1.4rem;
            text-shadow: 0 0 10px #00ff00;
            margin-bottom: 1rem;
          }
          .input-group {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
          }
          .input {
            flex: 1;
            padding: 0.8rem;
            border: 2px solid #00ff00;
            border-radius: 8px;
            font-size: 1rem;
            outline: none;
            background: #000;
            color: #00ff00;
          }
          .input::placeholder {
            color: #00ff00;
          }
          .button {
            padding: 0.8rem 1.2rem;
            border: 2px solid #00ff00;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            background: #000;
            color: #00ff00;
            transition: 0.3s ease-in-out;
            text-shadow: 0 0 10px #00ff00;
          }
          .button:hover {
            background: #00ff00;
            color: #000;
            box-shadow: 0 0 15px #00ff00;
          }
          @media (max-width: 600px) {
            .input-group {
              flex-direction: column;
            }
            .button {
              width: 100%;
              text-align: center;
            }
          }
        `}
      </style>
      <header>
        <h1 className="terminal">DeFi Lending Pool</h1>
        <p>
          Connected Account: <span className="highlight">{account}</span>
        </p>
        <p>
          Account Balance: <span className="highlight">{balance} ETH</span>
        </p>
      </header>
      <section className="actions">
        <h2>Deposit/Withdraw</h2>
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter ETH amount"
            className="input"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
          <button className="button" onClick={depositETH}>
            Deposit
          </button>
          <button className="button" onClick={withdrawETH}>
            Withdraw
          </button>
        </div>
        <p>
          Total Earned (Deposit + Interest):{" "}
          <span className="highlight">{totalEarned} ETH</span>
        </p>
      </section>
      <section className="actions">
        <h2>Loan Management</h2>
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter Loan Amount"
            className="input"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
          />
          <button className="button" onClick={requestLoan}>
            Request Loan
          </button>
          <button className="button" onClick={repayLoan}>
            Repay Loan
          </button>
        </div>
        <p>
          Total Repayment (Loan + Interest):{" "}
          <span className="highlight">{totalRepayment} ETH</span>
        </p>
      </section>
    </div>
  );
}

export default App;