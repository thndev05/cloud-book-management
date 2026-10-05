const mongoose = require('mongoose');

const readConnection = mongoose.createConnection(
    process.env.MONGODB_READ_URI,
    {
        dbName: 'DB_23IT199'
    }
);

const writeConnection = mongoose.createConnection(
    process.env.MONGODB_WRITE_URI,
    {
        dbName: 'DB_23IT199'
    }
);

readConnection.on('connected', () => {
    console.log('MongoDB READ connection connected');
});

writeConnection.on('connected', () => {
    console.log('MongoDB WRITE connection connected');
});

readConnection.on('error', (err) => {
    console.error('READ connection error:', err.message);
});

writeConnection.on('error', (err) => {
    console.error('WRITE connection error:', err.message);
});

module.exports = {
    readConnection,
    writeConnection
};