const RippleAPI = require('ripple-lib').RippleAPI
//var api = new RippleAPI();

module.exports = function(app){
  
  var api = new RippleAPI({
    server: 'wss://s1.ripple.com' //MAINNET
    //server: 'wss://s.altnet.rippletest.net:51233' //TESTNET 
  });

  app.get('/', function(req, res){
    
      res.render('index.html');
    
  });

  app.get('/test', function(req, res){
    
      res.render('test.html');
    
  });

  app.get('/generateAddress', function(req, res){

     var account = api.generateAddress();
     res.send(account);

  });

  app.post('/checkBalance', function(req, res){

      api.connect().then(() => {
        //console.log('Connected...');
        var address = req.body.address;
        console.log(address) 
        api.getAccountInfo(address).then(info => {
          console.log(info.xrpBalance);
          res.send('Your Ripple Balance is ' + info.xrpBalance + ' XRP' + '<BR><BR><a href="/">Back</a>');
        }).catch(err => {
          //console.log(err);
          res.send('Invalid Ripple address or Balance is less than 22 XRP' + '<BR><BR><a href="/">Back</a>')
        })            
        api.disconnect()
      }).catch()

      //res.send(balance.xrpBalance);
    
  });

  app.post('/transferRipple', function(req, res){
    
      var sender_address = req.body.address1;
      var sender_secret = req.body.secret1;
      var recipient_address = req.body.address2;
      var amount = req.body.amount;

      const instructions = {maxLedgerVersionOffset: 5}
      const currency = 'XRP'
      
      const payment = {
        source: {
          address: sender_address,
          maxAmount: {
            value: amount,
            currency: currency
          }
        },
        destination: {
          address: recipient_address,
          amount: {
            value: amount,
            currency: currency
          }
        }
      }

      api.connect().then(() => {
        //console.log('Connected...')
        api.preparePayment(sender_address, payment, instructions).then(prepared => {
          const {signedTransaction, id} = api.sign(prepared.txJSON, sender_secret)
          console.log(id)
          api.submit(signedTransaction).then(result => {
            console.log(JSON.stringify(result, null, 2));
            res.send(result.resultMessage + '<BR><BR><a href="/">Back</a>');
           }).catch(err => {
              //console.log(err);
              res.send('Transaction was unsuccessful. Make sure addresses have balances and try again.' + '<BR><BR><a href="/">Back</a>')
            })      
           api.disconnect()  
         })      
        }).catch(console.error)

      //res.send(getXrpBalance(address));
    
  });

  app.post('/donateToTheDeveloper', function(req, res){
    
      var sender_address = req.body.address1;
      var sender_secret = req.body.secret1;
      var recipient_address = 'rUqnEUEknY3fY2rN5w4xezwSdGYJQz4tzt';
      var amount = '22';

      const instructions = {maxLedgerVersionOffset: 5}
      const currency = 'XRP'
      
      const payment = {
        source: {
          address: sender_address,
          maxAmount: {
            value: amount,
            currency: currency
          }
        },
        destination: {
          address: recipient_address,
          amount: {
            value: amount,
            currency: currency
          }
        }
      }

      api.connect().then(() => {
        //console.log('Connected...')
        api.preparePayment(sender_address, payment, instructions).then(prepared => {
          const {signedTransaction, id} = api.sign(prepared.txJSON, sender_secret)
          console.log(id)
          api.submit(signedTransaction).then(result => {
            console.log(JSON.stringify(result, null, 2));
            res.send(result.resultMessage + '<BR><BR>Thank you very much for your donation! <BR><BR><a href="/">Back</a>');
           })      
           api.disconnect()  
         })      
        }).catch(console.error)

      //res.send(getXrpBalance(address));
    
  });

  // Get AccountInfo
  function getXrpBalance(address) {
    return api.getAccountInfo(address).then(info => {
      //console.log(info.xrpBalance);
   });
  }; 


};

