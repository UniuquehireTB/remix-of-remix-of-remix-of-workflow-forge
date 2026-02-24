import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const app = require('../server/index.js');

export default (req, res) => {
    return app(req, res);
};
