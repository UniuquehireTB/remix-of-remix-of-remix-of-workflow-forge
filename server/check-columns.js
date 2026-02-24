const { sequelize } = require('./db');

const check = async () => {
    try {
        const [results] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'NoteShares'");
        console.log('Columns in NoteShares:', JSON.stringify(results, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
