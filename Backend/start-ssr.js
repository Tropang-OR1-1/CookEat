// start-ssr.js
require('@babel/register')({
    extensions: ['.js', '.jsx'],
    ignore: [/node_modules/]
  });
  
  require('./server.js'); // or './server/server.js' depending on your structure
  