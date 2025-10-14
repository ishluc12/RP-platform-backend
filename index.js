const express = require("express");
const app = express();
const availabilityRoutes = require('./src/routes/lecturer/availability');

app.use(express.json());

app.use('/api/lecturer/availability', availabilityRoutes);

const PORT = 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));