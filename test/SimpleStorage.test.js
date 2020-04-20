/*
  Author: Soham Zemse (https://github.com/zemse)
  In this file you should write tests for your smart contract as you progress in developing your smart contract. For reference of Mocha testing framework, you can check out https://devdocs.io/mocha/.
*/

/// @dev importing packages required
const assert = require('assert');
const ethers = require('ethers');
const ganache = require('ganache-cli');
const { parseTx } = require('../helpers');

/// @dev when you make this true, the parseTx helper will output transaction gas consumption and logs
const DEBUG_MODE = false;

/// @dev initialising development blockchain
const provider = new ethers.providers.Web3Provider(ganache.provider({ gasLimit: 80000000 }));

/// @dev importing build file
const simpleStorageJSON = require('../build/SimpleStorage_landRegistration.json');

/// @dev initialize global variables
let accounts, simpleStorageInstance;
let mValue;
/// @dev this is a test case collection
describe('Ganache Setup', async() => {

  /// @dev this is a test case. You first fetch the present state, and compare it with an expectation. If it satisfies the expectation, then test case passes else an error is thrown.
  it('initiates ganache and generates a bunch of demo accounts..Like a local blockchain', async() => {

    /// @dev for example in this test case we are fetching accounts array.
    accounts = await provider.listAccounts();

    /// @dev then we have our expection that accounts array should be at least having 1 accounts
    assert.ok(accounts.length >= 1, 'atleast 2 accounts should be present in the array');
  });
});

/// @dev this is another test case collection
describe('Land Registration Contract', () => {

  /// @dev describe under another describe is a sub test case collection
  describe('Land Registration Setup', async() => {

    /// @dev this is first test case of this collection
    it('deploys Simple Storage contract from first account with initial storage: landRegistration', async() => {

      /// @dev you create a contract factory for deploying contract. Refer to ethers.js documentation at https://docs.ethers.io/ethers.js/html/
      const SimpleStorageContractFactory = new ethers.ContractFactory(
        simpleStorageJSON.abi,
        simpleStorageJSON.evm.bytecode.object,
        provider.getSigner(accounts[0])
      );
      simpleStorageInstance =  await SimpleStorageContractFactory.deploy();

      assert.ok(simpleStorageInstance.address, 'conract address should be present');
    });

    /// @dev this is second test case of this collection
    // it('value should be set properly while deploying', async() => {

    //   /// @dev you access the value at storage with ethers.js library of our custom contract method called getValue defined in contracts/SimpleStorage.sol
    //   const currentValue = await simpleStorageInstance.functions.getValue();

    //   /// @dev then you compare it with your expectation value
    //   assert.equal(
    //     currentValue,
    //     'hello world',
    //     'value set while deploying must be visible when get'
    //   );
    // });
  });

  describe('Land Registration Functionality', async  => {

    /// @dev this is first test case of this collection
    it('should compute the Id', async() => {

      /// @dev now get the value at storage
      const currentValue = await simpleStorageInstance.functions.computeId('','','',1);

      /// @dev then comparing with expectation value
      assert.equal(
        currentValue,
        9459944778998
      );
    });
    it("Registering the land by accounts[0]", async() => {
      let id = await simpleStorageInstance.functions.computeId('maharashtra','thane','kalyan',21);
      let register = await parseTx(simpleStorageInstance.functions.Registration('maharashtra','thane','kalyan',21,accounts[1],20,id), DEBUG_MODE)
      assert(register);

        //     const receipt = await parseTx(instance.functions.setValue('hi'), DEBUG_MODE);

    });

  });
  describe('Checking successful LandTransaction',async()=>{
    it("checking successful registration",async()=>{
      let value = 20;

      let marketValue = ethers.utils.parseEther(value.toString());
      mValue = marketValue;
      let id = await simpleStorageInstance.functions.computeId('maharashtra','thane','kalyan',21);
       await parseTx(simpleStorageInstance.functions.Registration('maharashtra','thane','kalyan',21,accounts[1],marketValue,id), DEBUG_MODE)
      let landInfo = await simpleStorageInstance.functions.landInfoUser(id);
      assert.equal(landInfo[0],accounts[1]);
    });
    it("checking the availability before making available, by default it is unavailable",async()=>{
      let id = await simpleStorageInstance.functions.computeId('maharashtra','thane','kalyan',21);
      let landInfo = await simpleStorageInstance.landInfoUser(id);
      assert.equal(landInfo[2],false);

    })
    it("checking that the buyer can only make request if the property is available for sale", async() => {
      let id = await simpleStorageInstance.functions.computeId('maharashtra','thane','kalyan',21);
      let state;
      try {
        let instance1 = simpleStorageInstance.connect(provider.getSigner(accounts[1]))

        await instance1.functions.requstToLandOwner(id);
        state =false;

      } catch (error) {
        state = true;

      }      
      assert(state);
    })
    it("checking the availability for buying a land after make it avialable", async() => {
      let id = await simpleStorageInstance.functions.computeId('maharashtra','thane','kalyan',21);
     let instance1 = simpleStorageInstance.connect(provider.getSigner(accounts[1]))
     let instance2 = simpleStorageInstance.connect(provider.getSigner(accounts[2]))
     await instance1.functions.makeAvailable(id);
      let landInfo = await instance2.functions.landInfoUser(id);
      assert.equal(landInfo[2],true);
    })

    it("checking that the request for land works!!", async() => {
      let id = await simpleStorageInstance.functions.computeId('maharashtra','thane','kalyan',21);
      let instance2 = simpleStorageInstance.connect(provider.getSigner(accounts[2]))
      await instance2.functions.requstToLandOwner(id);
      let landInfo = await instance2.functions.landInfoUser(id);
      assert.equal(landInfo[3],accounts[2])
    });
    it("checking that the buyer can only buy, if the request is approved by the owner", async() => {
      let id = await simpleStorageInstance.functions.computeId('maharashtra','thane','kalyan',21);
      let state;
      try {
        let instance2 = simpleStorageInstance.connect(provider.getSigner(accounts[2]))
        await instance2.functions.buyProperty(id,{value : mValue });
        state = false;
      } catch (error) {
        state = true;

      }
      assert(state);
    });
    it("checking that the request approval works!!", async() => {
      let id = await simpleStorageInstance.functions.computeId('maharashtra','thane','kalyan',21);

      let instance1 = simpleStorageInstance.connect(provider.getSigner(accounts[1]))
      let instance2 = simpleStorageInstance.connect(provider.getSigner(accounts[2]))
      await instance1.functions.processRequest(id,3);
      let landInfo = await instance2.landInfoUser(id);
      assert.equal(landInfo[4],3)

    })
    it("checking that the buyer can buy the property and the ownership changes", async() => {
      let id = await simpleStorageInstance.functions.computeId('maharashtra','thane','kalyan',21);
      let instance2 = simpleStorageInstance.connect(provider.getSigner(accounts[2]))
      await instance2.functions.buyProperty(id,{value : mValue});
      let landInfo = await instance2.landInfoUser(id);
      assert.equal(landInfo[0],accounts[2]);

    })

  });
  
});

