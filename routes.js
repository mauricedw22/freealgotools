const algosdk = require('algosdk');

module.exports = function(app){

    const algodServer = "https://mainnet-algorand.api.purestake.io/ps2";
    const algodPort = "";
    const algodToken = {
        'X-API-Key': "X7HxsshAnN626baE6sNP9963GCwayNPXamoGg3fy"
    };

    const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

    const waitForConfirmation = async function (algodClient, txId, timeout) {
      if (algodClient == null || txId == null || timeout < 0) {
          throw new Error("Bad arguments");
      }

      const status = (await algodClient.status().do());
      if (status === undefined) {
          throw new Error("Unable to get node status");
      }

      const startround = status["last-round"] + 1;
      let currentround = startround;

      while (currentround < (startround + timeout)) {
          const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
          if (pendingInfo !== undefined) {
              if (pendingInfo["confirmed-round"] !== null && pendingInfo["confirmed-round"] > 0) {
                  //Got the completed Transaction
                  return pendingInfo;
              } else {
                  if (pendingInfo["pool-error"] != null && pendingInfo["pool-error"].length > 0) {
                      // If there was a pool error, then the transaction has been rejected!
                      throw new Error("Transaction " + txId + " rejected - pool error: " + pendingInfo["pool-error"]);
                  }
              }
          }
          await algodClient.statusAfterBlock(currentround).do();
          currentround++;
      }

      throw new Error("Transaction " + txId + " not confirmed after " + timeout + " rounds!");
  };

  app.get('/', function(req, res){
    
      res.render('index.html');
    
  });

  app.get('/generateAddress', function(req, res){

      var account = algosdk.generateAccount();
      var passphrase = algosdk.secretKeyToMnemonic(account.sk);
      var obj = {"address": account.addr, "passphrase": passphrase};
      res.send(obj);

  });

  app.post('/checkBalance', function(req, res){

      (async() => {

        var address = req.body.address;
    
        let accountInfo = await algodClient.accountInformation(address).do();
        console.log("Account balance: %d microAlgos", accountInfo.amount);
        res.send('Your ALGO balance is ' + (accountInfo.amount/1000000) + ' ALGO. <BR><BR><a href="/">Back</a>');
    
      })().catch(e => {
      
        console.log(e);
        res.send('Error occurred while retrieving balance. Please verify your address is on Mainnet.');
      
      }); 
      
  });

  app.post('/transferAlgo', function(req, res){
      
      (async() => {

        var passphrase = req.body.passphrase;
        var receiver = req.body.receiver;
        var amount = (req.body.amount)*1000000;

        let myAccount = algosdk.mnemonicToSecretKey(passphrase);
        let sender = myAccount.addr;
        console.log("Sender address: %s", sender);

        let accountInfo = await algodClient.accountInformation(sender).do();
        //console.log("Account balance: %d microAlgos", accountInfo.amount);

        let params = await algodClient.getTransactionParams().do();
        const enc = new TextEncoder();
        let note = enc.encode("Txn");
        let txn = algosdk.makePaymentTxnWithSuggestedParams(sender, receiver, amount, undefined, note, params);
        
        let signedTxn = txn.signTxn(myAccount.sk);
        let txId = txn.txID().toString();
        console.log("Signed transaction with txID: %s", txId);

        await algodClient.sendRawTransaction(signedTxn).do();

        // Wait for confirmation
        let confirmedTxn = await waitForConfirmation(algodClient, txId, 4);
        //Get the completed Transaction
        console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
        let mytxinfo = JSON.stringify(confirmedTxn.txn.txn, undefined, 2);
        console.log("Transaction information: %o", mytxinfo);
        var string = new TextDecoder().decode(confirmedTxn.txn.txn.note);
        console.log("Note field: ", string);
        res.send('Transfer successful. <BR><BR><a href="/">Back</a>');

    })().catch(e => {

        console.log(e);
        res.send('Transfer unsuccessful. Please try again. <BR><BR><a href="/">Back</a>');

    });
      
  });
    
  app.post('/donateToTheDeveloper', function(req, res){
      
      (async() => {

        var passphrase = req.body.passphrase;
        var receiver = "3G43UUPLUBKSB2QU6BTID2ODT3SXFLNEKHKEAUWYFNNEFI2LO57HI5KJTA";
        var amount = (req.body.amount)*1000000;

        let myAccount = algosdk.mnemonicToSecretKey(passphrase);
        let sender = myAccount.addr;
        console.log("Sender address: %s", sender);

        let accountInfo = await algodClient.accountInformation(sender).do();
        //console.log("Account balance: %d microAlgos", accountInfo.amount);

        let params = await algodClient.getTransactionParams().do();
        const enc = new TextEncoder();
        let note = enc.encode("Donation");
        let txn = algosdk.makePaymentTxnWithSuggestedParams(sender, receiver, amount, undefined, note, params);
        
        let signedTxn = txn.signTxn(myAccount.sk);
        let txId = txn.txID().toString();
        console.log("Signed transaction with txID: %s", txId);

        await algodClient.sendRawTransaction(signedTxn).do();

        // Wait for confirmation
        let confirmedTxn = await waitForConfirmation(algodClient, txId, 4);
        //Get the completed Transaction
        console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
        let mytxinfo = JSON.stringify(confirmedTxn.txn.txn, undefined, 2);
        console.log("Transaction information: %o", mytxinfo);
        var string = new TextDecoder().decode(confirmedTxn.txn.txn.note);
        console.log("Note field: ", string);
        res.send('Thank you very much for your donation! <BR><BR><a href="/">Back</a>');

    })().catch(e => {

        console.log(e);
        res.send('Sorry, something went wrong with your donation transaction. Please try again. <BR><BR><a href="/">Back</a>');

    });
    
  });

  app.post('/optInWALK', function(req, res){

    (async() => {

      assetID = 336971959;

      let passphrase = req.body.passphrase;

      let params = await algodClient.getTransactionParams().do();
      // Opt-in Recipient account
      params.fee = 1000;
      params.flatFee = true;

      let optInAcct = algosdk.mnemonicToSecretKey(passphrase);
      let sender1 = optInAcct.addr;
      let recipient1 = optInAcct.addr;
      
      // We set revocationTarget to undefined as 
      // This is not a clawback operation
      let revocationTarget1 = undefined;
      // CloseReaminerTo is set to undefined as
      // we are not closing out an asset
      let closeRemainderTo1 = undefined;
      let note1 = undefined;
      // We are sending 0 assets
      let amount1 = 0;

      // signing and sending "txn" allows sender to begin accepting asset specified by creator and index
      let opttxn = algosdk.makeAssetTransferTxnWithSuggestedParams(sender1, recipient1, closeRemainderTo1, revocationTarget1,
          amount1, note1, assetID, params);

      // Must be signed by the account wishing to opt in to the asset    
      rawSignedTxn = opttxn.signTxn(optInAcct.sk);
      let opttx = (await algodClient.sendRawTransaction(rawSignedTxn).do());
      console.log("Transaction : " + opttx.txId);
      // wait for transaction to be confirmed
      // await waitForConfirmation(algodClient, opttx.txId);

      //You should now see the new asset listed in the account information
      console.log("New OptIn Account = " + sender1);
      await printAssetHolding(algodClient, recipient1, assetID);
      res.send('You are now opted in and ready to receive WALK! <BR><BR> Last step: Complete the BUY WALK form on the <a href="/">previous page</a>.');

    })().catch(e => {

      console.log(e);
      res.send('You are now opted in and ready to receive WALK! <BR><BR> Last step: Complete the BUY WALK form on the <a href="/">previous page</a>.');

    });

  });

  app.post('/buyWALK', function(req, res){

    (async() => {

      // ALGO for WALK transaction
      var passphrase = req.body.passphrase;
      var receiver = "3G43UUPLUBKSB2QU6BTID2ODT3SXFLNEKHKEAUWYFNNEFI2LO57HI5KJTA";
      var amt = req.body.amount;
      var amount = (amt)*1000000;

      let myAccount = algosdk.mnemonicToSecretKey(passphrase);
      let sender = myAccount.addr;
      console.log("Sender address: %s", sender);

      //let accountInfo = await algodClient.accountInformation(sender).do();
      //console.log("Account balance: %d microAlgos", accountInfo.amount);

      let params = await algodClient.getTransactionParams().do();
      const enc = new TextEncoder();
      let note = enc.encode("Accepting ALGO for WALK");
      let txn = algosdk.makePaymentTxnWithSuggestedParams(sender, receiver, amount, undefined, note, params);
      
      let signedTxn = txn.signTxn(myAccount.sk);
      let txId = txn.txID().toString();
      console.log("Signed transaction with txID: %s", txId);

      await algodClient.sendRawTransaction(signedTxn).do();

      // Wait for confirmation
      let confirmedTxn = await waitForConfirmation(algodClient, txId, 4);
      //Get the completed Transaction
      console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
      let mytxinfo = JSON.stringify(confirmedTxn.txn.txn, undefined, 2);
      console.log("Transaction information: %o", mytxinfo);
      var string = new TextDecoder().decode(confirmedTxn.txn.txn.note);
      console.log("Note field: ", string);


      // AssetID for WALK
      assetID = 336971959;

      // Send WALK to recipient
      var sk1 = "toss economy south ranch slender sphere immune type rare valve report cactus front good goat shy patch age giant delay now they pact about hidden";

      let senderAcct = algosdk.mnemonicToSecretKey(sk1);
      let sender2 = senderAcct.addr;
      let recipient2 = sender;

      revocationTarget2 = undefined;
      closeRemainderTo2 = undefined;
      let note2 = undefined;
      //Amount of the asset to transfer
      let amount2 = (amt*100);

      // signing and sending "txn" will send "amount" assets from "sender" to "recipient"
      let xtxn = algosdk.makeAssetTransferTxnWithSuggestedParams(sender2, recipient2, closeRemainderTo2, revocationTarget2,
          amount2,  note2, assetID, params);
      // Must be signed by the account sending the asset  
      rawSignedTxn2 = xtxn.signTxn(senderAcct.sk);
      let xtx = (await algodClient.sendRawTransaction(rawSignedTxn2).do());
      console.log("Transaction: " + xtx.txId);
      // wait for transaction to be confirmed
      // await waitForConfirmation(algodClient, xtx.txId);

      // You should now see the 10 assets listed in the account information
      console.log(amount2 + " WALK sent to " + recipient2);
      await printAssetHolding(algodClient, recipient2, assetID);

      res.send('Thank you for purchasing ' + (amount2) + ' WALK! <BR><BR><a href="/">Back</a>');

    })().catch(e => {

      console.log(e);
      res.send('Your WALK is on the way! Thank you for your purchase! <BR><BR><a href="/">Back</a>');

    });

  });

  /* app.get('/sendWalkcoin', function(req, res){

    (async() => {

      // Send WALK to issuer acct

      assetID = 336971959;

      var sk1 = "innocent hood believe deposit absent climb dizzy wedding check general inherit narrow soda exile enlist zero six view primary tree country scale nut abstract race";

      let senderAcct = algosdk.mnemonicToSecretKey(sk1);
      let sender2 = senderAcct.addr;
      let recipient2 = "3G43UUPLUBKSB2QU6BTID2ODT3SXFLNEKHKEAUWYFNNEFI2LO57HI5KJTA";

      let params = await algodClient.getTransactionParams().do();

      revocationTarget2 = undefined;
      closeRemainderTo2 = undefined;
      let note2 = undefined;
      //Amount of the asset to transfer
      let amount2 = 10000000;

      // signing and sending "txn" will send "amount" assets from "sender" to "recipient"
      let xtxn = algosdk.makeAssetTransferTxnWithSuggestedParams(sender2, recipient2, closeRemainderTo2, revocationTarget2,
          amount2,  note2, assetID, params);
      // Must be signed by the account sending the asset  
      rawSignedTxn2 = xtxn.signTxn(senderAcct.sk);
      let xtx = (await algodClient.sendRawTransaction(rawSignedTxn2).do());
      console.log("Transaction: " + xtx.txId);
      // wait for transaction to be confirmed
      await waitForConfirmation(algodClient, xtx.txId);

      // You should now see the 10 assets listed in the account information
      console.log(amount2 + " WALK sent to " + recipient2);
      await printAssetHolding(algodClient, recipient2, assetID);

      res.send('Sent back ' + (amount2) + ' WALK to ' + recipient2 + '.<BR><BR><a href="/">Back</a>');

    })().catch(e => {

      console.log(e);
      res.send('Sorry, something went wrong with the WALK sendback transaction. Please try again. <BR><BR><a href="/">Back</a>');

    });

  }); */

};