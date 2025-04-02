require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database/hospital.db',
  logging: false
});

// Define Models
const Patient = sequelize.define('Patient', {
  name: { type: DataTypes.STRING, allowNull: false },
  age: { type: DataTypes.INTEGER, allowNull: false },
  gender: { type: DataTypes.STRING, allowNull: false },
  contact: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.TEXT }
});

const Doctor = sequelize.define('Doctor', {
  name: { type: DataTypes.STRING, allowNull: false },
  specialization: { type: DataTypes.STRING, allowNull: false },
  contact: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING }
});

const Appointment = sequelize.define('Appointment', {
  patientId: { type: DataTypes.INTEGER, allowNull: false },
  doctorId: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false }
});

// Define Associations
Patient.hasMany(Appointment, { foreignKey: 'patientId' });
Doctor.hasMany(Appointment, { foreignKey: 'doctorId' });
Appointment.belongsTo(Patient, { foreignKey: 'patientId' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId' });

// Initialize Database
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: false }); // Set force:true to reset db on startup
    console.log('Database connected and synced');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Routes
// Patients
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await Patient.findAll();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create patient' });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  try {
    const deleted = await Patient.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Patient not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

// Doctors
app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.findAll();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

app.post('/api/doctors', async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    res.status(201).json(doctor);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create doctor' });
  }
});

app.delete('/api/doctors/:id', async (req, res) => {
  try {
    const deleted = await Doctor.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete doctor' });
  }
});

// Appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      include: [
        { model: Patient, attributes: ['name', 'contact'] },
        { model: Doctor, attributes: ['name', 'specialization'] }
      ]
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    // Validate patient and doctor exist
    const [patient, doctor] = await Promise.all([
      Patient.findByPk(req.body.patientId),
      Doctor.findByPk(req.body.doctorId)
    ]);
    
    if (!patient || !doctor) {
      return res.status(400).json({ error: 'Invalid patient or doctor ID' });
    }

    const appointment = await Appointment.create(req.body);
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create appointment' });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const deleted = await Appointment.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Appointment not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start Server
async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();