const { sequelize } = require('./db');
const models = require('./models');

const sync = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected');
        await sequelize.sync({ alter: true });
        console.log('Synced');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

sync();
