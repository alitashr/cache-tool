const net = require('net');
// const port = 3000;
// const { machineIdSync } = require('node-machine-id');
const port = process.env.PORT ? (process.env.PORT - 100) : 6995;
console.log("process.env.PORT", process.env.PORT)

process.env.ELECTRON_START_URL = `http://localhost:${port}`;

const client = new net.Socket();

let startedElectron = false;
// const id = machineIdSync()
// console.log(id)
const tryConnection = () => client.connect({ port: port }, () => {
  client.end();
  if (!startedElectron) {
    startedElectron = true;
    const exec = require('child_process').exec;
    exec('yarn electron');
  }
}
);

tryConnection();

client.on('error', (error) => {
  setTimeout(tryConnection, 1000);
});