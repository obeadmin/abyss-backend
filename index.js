const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const { Client } = require("pg");
const bcrypt = require('bcrypt'); // Ensure bcrypt is imported

// JWT secret key
const jwtSecret = 'hashtown@1223';

const app = express();
app.use(cors());
app.use(express.json()); // Middleware to parse JSON

// Setup connection to PostgreSQL
const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "Anirban@123",
  port: 5432,
});

// Connect to the PostgreSQL database
client.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err.stack);
    return;
  }
  console.log("Connected to PostgreSQL database!");
});

// API endpoint to get all academic years
app.get("/academicyears", async (req, res) => {
  try {
    const { rows } = await client.query("SELECT yearname FROM academicyear ORDER BY yearname ASC");
    res.json(rows);
  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});


// API endpoint to get all schools based on selected year
app.get("/schools", async (req, res) => {
  const { year } = req.query;
  try {
    // Get the academic year ID based on the year name
    const yearResult = await client.query("SELECT academicyearid FROM academicyear WHERE yearname = $1", [year]);
    if (yearResult.rows.length === 0) {
      return res.status(404).send("Academic year not found");
    }
    const academicyearid = yearResult.rows[0].academicyearid;

    // Get the schools based on the academic year ID
    const { rows } = await client.query("SELECT * FROM Schools WHERE academicyearid = $1 ORDER BY school_code ASC", [academicyearid]);
    res.json(rows);
  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});

app.post('/assign-batches', async (req, res) => {
  const { batch_name, semester_name, student_ids } = req.body;

  try {
      await client.query('BEGIN');

      const queryText = 'SELECT assign_batches($1, $2, $3)';
      await client.query(queryText, [batch_name, semester_name, student_ids]);

      await client.query('COMMIT');
      res.status(200).json({ message: 'Batch assigned successfully' });
  } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error assigning batches:', err);
      res.status(500).json({ message: 'Error assigning batches' });
  }
});


// Endpoint to fetch all semester names
app.get("/semesters", async (req, res) => {
  try {
    const result = await client.query("SELECT semester_name FROM semester");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching semesters");
  }
});


// API endpoint to get all departments based on selected year
app.get("/departments", async (req, res) => {
  const { year } = req.query;
  try {
    // Get the academic year ID based on the year name
    const yearResult = await client.query("SELECT academicyearid FROM academicyear WHERE yearname = $1", [year]);
    if (yearResult.rows.length === 0) {
      return res.status(404).send("Academic year not found");
    }
    const academicyearid = yearResult.rows[0].academicyearid;

    // Get the departments based on the academic year ID
    const { rows } = await client.query("SELECT * FROM Departments WHERE academicyearid = $1 ORDER BY dept_code ASC", [academicyearid]);
    res.json(rows);
  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});

// API endpoint to get all programs based on selected year
app.get("/programs", async (req, res) => {
  const { year } = req.query;
  try {
    const yearResult = await client.query("SELECT academicyearid FROM academicyear WHERE yearname = $1", [year]);
    if (yearResult.rows.length === 0) {
      return res.status(404).send("Academic year not found");
    }
    const academicyearid = yearResult.rows[0].academicyearid;

    const { rows } = await client.query("SELECT * FROM Programs WHERE academicyearid = $1 ORDER BY program_code ASC", [academicyearid]);
    res.json(rows);
  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});

// API endpoint to get all employees based on selected year
app.get("/employees", async (req, res) => {
  const { year } = req.query;
  try {
    const yearResult = await client.query("SELECT academicyearid FROM academicyear WHERE yearname = $1", [year]);
    if (yearResult.rows.length === 0) {
      return res.status(404).send("Academic year not found");
    }
    const academicyearid = yearResult.rows[0].academicyearid;

    const { rows } = await client.query("SELECT * FROM Employee WHERE academicyearid = $1 ORDER BY employee_code ASC", [academicyearid]);
    res.json(rows);
  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});

// API endpoint to get all students based on selected year
app.get("/students", async (req, res) => {
  const { year } = req.query;
  try {
    const yearResult = await client.query("SELECT academicyearid FROM academicyear WHERE yearname = $1", [year]);
    if (yearResult.rows.length === 0) {
      return res.status(404).send("Academic year not found");
    }
    const academicyearid = yearResult.rows[0].academicyearid;

    const { rows } = await client.query("SELECT * FROM Students WHERE academicyearid = $1 ORDER BY student_code ASC", [academicyearid]);
    res.json(rows);
  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});



// Endpoint to fetch students based on filters
app.get("/allotstudents", async (req, res) => {
  const { school_id, department_id, program_id, semestername, limit } = req.query;

  try {
    const result = await client.query(
      `SELECT * FROM students
       WHERE school_id = $1 AND department_id = $2 AND program_id = $3 AND semester_name = $4
       LIMIT $5`,
      [school_id, department_id, program_id, semestername, limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching students");
  }
});


// API endpoint to get all program structures based on selected year
app.get("/programstructures", async (req, res) => {
  const { year } = req.query;
  try {
    const yearResult = await client.query("SELECT academicyearid FROM academicyear WHERE yearname = $1", [year]);
    if (yearResult.rows.length === 0) {
      return res.status(404).send("Academic year not found");
    }
    const academicyearid = yearResult.rows[0].academicyearid;

    const { rows } = await client.query("SELECT * FROM Program_Structure WHERE academicyearid = $1 ORDER BY course_code ASC", [academicyearid]);
    res.json(rows);
  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});

// API endpoint to get courses based on semester
app.get("/courses", async (req, res) => {
  const { semester } = req.query;
  try {
    const { rows } = await client.query("SELECT school_name, course_code, course_title, lecture_hours, tutorial_hours, practical_hours, total_hours, credits FROM Program_Structure WHERE semester_name = $1 ORDER BY course_code ASC", [semester]);
    res.json(rows);
  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});

// API endpoint to get course types
app.get("/course_types", async (req, res) => {
  try {
    const { rows } = await client.query("SELECT * FROM course_type_defination");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching course types:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});

// New API endpoint to get courses based on course type
app.get("/courses_by_type", async (req, res) => {
  const { course_type } = req.query;
  try {
    const { rows } = await client.query("SELECT * FROM Program_Structure WHERE course_type = $1 ORDER BY course_code ASC", [course_type]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching courses by type:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});


// Update student registration status
app.post('/update_student_registered', (req, res) => {
  const { user_id, registered } = req.body;
  const query = 'UPDATE students SET registered = $1 WHERE user_id = $2';
  client.query(query, [registered, user_id], (err) => {
    if (err) {
      console.error('Error updating student registration status:', err);
      res.status(500).send('Server error');
      return;
    }
    res.sendStatus(200);
  });
});

// Update student course selection
app.post('/update_student_course', (req, res) => {
  const { user_id, column, value } = req.body;
  const addColumnQuery = `ALTER TABLE students ADD COLUMN IF NOT EXISTS "${column}" VARCHAR(255)`;
  const updateCourseQuery = `UPDATE students SET "${column}" = $1 WHERE user_id = $2`;

  client.query(addColumnQuery, (err) => {
    if (err) {
      console.error('Error adding column to student table:', err);
      res.status(500).send('Server error');
      return;
    }

    client.query(updateCourseQuery, [value, user_id], (err) => {
      if (err) {
        console.error('Error updating student course selection:', err);
        res.status(500).send('Server error');
        return;
      }
      res.sendStatus(200);
    });
  });
});

// API endpoint to get student details
// API endpoint to get student details
// API endpoint to get student details
app.get("/studentdetails", async (req, res) => {
  const { username, user_id } = req.query;
  console.log('Received request to get student details:', { username, user_id });

  try {
    const studentResult = await client.query("SELECT * FROM students WHERE username = $1 OR user_id = $2", [username, user_id]);
    console.log('Query result:', studentResult.rows);

    if (studentResult.rows.length === 0) {
      return res.status(404).send("Student not found");
    }
    res.json(studentResult.rows[0]);
  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});




// API endpoint to get all slot assignments based on selected year
app.get("/slot_assignments", async (req, res) => {
  const { year } = req.query;
  try {
    const yearResult = await client.query("SELECT academicyearid FROM academicyear WHERE yearname = $1", [year]);
    if (yearResult.rows.length === 0) {
      return res.status(404).send("Academic year not found");
    }
    const academicyearid = yearResult.rows[0].academicyearid;

    const { rows } = await client.query("SELECT * FROM Slot_Assignment WHERE academicyearid = $1 ORDER BY course_code ASC", [academicyearid]);
    res.json(rows);
  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});

// API endpoint to get all rooms based on selected year
app.get("/rooms", async (req, res) => {
  const { year } = req.query;
  try {
    const yearResult = await client.query("SELECT academicyearid FROM academicyear WHERE yearname = $1", [year]);
    if (yearResult.rows.length === 0) {
      return res.status(404).send("Academic year not found");
    }
    const academicyearid = yearResult.rows[0].academicyearid;

    const { rows } = await client.query("SELECT * FROM Rooms WHERE academicyearid = $1 ORDER BY room ASC", [academicyearid]);
    res.json(rows);
  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});


app.get('/fetchacademicyearid', async (req, res) => {
  const { yearname } = req.query;
  try {
    const query = `
      SELECT academicyearid FROM academicyear
      WHERE yearname = $1;
    `;
    const { rows } = await client.query(query, [yearname]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: 'Academic year not found' });
    }
  } catch (error) {
    console.error('Error querying academic years:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// API endpoint to add new entity
app.post("/add-entity", async (req, res) => {
  const { entity, ...data } = req.body;
  console.log("Received data:", req.body);

  try {
    if (entity === "Department") {
      const deptQuery = `
        INSERT INTO Departments (academicyearid, school_id, school_code, school_abbreviation, school_name, dept_name, dept_abbreviation, dept_code, dept_tags, established_year, dept_type, number_of_ug_programs, number_of_pg_programs, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *;
      `;
      const deptData = [
        data.academicyearid, data.school_id, data.school_code, data.school_abbreviation, data.school_name, data.dept_name, data.dept_abbreviation, data.dept_code, data.dept_tags, data.established_year, data.dept_type, data.number_of_ug_programs, data.number_of_pg_programs, data.status
      ];
      const deptRes = await client.query(deptQuery, deptData);
      res.status(201).json(deptRes.rows[0]);
    } else if (entity === "School") {
      const schoolQuery = `
        INSERT INTO Schools (academicyearid, school_name, school_code, school_abbreviation, school_tags, year_of_establishment, number_of_departments, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `;
      const schoolData = [
        data.academicyearid, data.school_name, data.school_code, data.school_abbreviation, data.school_tags, data.year_of_establishment, data.number_of_departments, data.status
      ];
      const schoolRes = await client.query(schoolQuery, schoolData);
      res.status(201).json(schoolRes.rows[0]);
    } else if (entity === "Program") {
      const programQuery = `
        INSERT INTO Programs (academicyearid, school_id, department_id, school_code, school_abbreviation, school_name, dept_name, program_code, program_abbreviation, program_name, program_credits, year_of_launch, duration, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *;
      `;
      const programData = [
        data.academicyearid,
        data.school_id,
        data.department_id,
        data.school_code,
        data.school_abbreviation,
        data.school_name,
        data.dept_name, // Ensure this field is included
        data.program_code,
        data.program_abbreviation,
        data.program_name,
        data.program_credits,
        data.year_of_launch,
        data.duration,
        data.status
      ];
      const programRes = await client.query(programQuery, programData);
      res.status(201).json(programRes.rows[0]);
    }
    
     else if (entity === "Employee") {
      const employeeQuery = `
        INSERT INTO Employee (academicyearid, school_id, department_id, school_code, school_abbreviation, school_name, employee_code, employee_name, email_id, contact_number, status, dept_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
      `;
      const employeeData = [
        data.academicyearid, data.school_id, data.department_id, data.school_code, data.school_abbreviation, data.school_name, data.employee_code, data.employee_name, data.email_id, data.contact_number, data.status, data.dept_name
      ];
      const employeeRes = await client.query(employeeQuery, employeeData);
      res.status(201).json(employeeRes.rows[0]);
    }
     else if (entity === "Student") {
      const studentQuery = `
        INSERT INTO Students (academicyearid, school_id, department_id, program_id, school_code, school_abbreviation, school_name, student_code, student_name, email_id, contact_number, status, dept_name, program_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *;
      `;
      const studentData = [
        data.academicyearid, data.school_id, data.department_id, data.program_id, data.school_code, data.school_abbreviation, data.school_name, data.student_code, data.student_name, data.email_id, data.contact_number, data.status, data.dept_name, data.program_name
      ];
      const studentRes = await client.query(studentQuery, studentData);
      res.status(201).json(studentRes.rows[0]);
    }
    else if (entity === "Program_Structure") {
      const programStructureQuery = `
        INSERT INTO Program_Structure (academicyearid, school_id, department_id, program_id, school_code, school_abbreviation, school_name, dept_name, program_name, semester, course_code, course_title, lecture_hours, tutorial_hours, practical_hours, total_hours, credits, marks)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *;
      `;
      const programStructureData = [
        data.academicyearid, data.school_id, data.department_id, data.program_id, data.school_code, data.school_abbreviation, data.school_name, data.dept_name, data.program_name, data.semester, data.course_code, data.course_title, data.lecture_hours, data.tutorial_hours, data.practical_hours, data.total_hours, data.credits, data.marks
      ];
      const programStructureRes = await client.query(programStructureQuery, programStructureData);
      res.status(201).json(programStructureRes.rows[0]);
    }
     else if (entity === "Slot_Assignment") {
      const slotAssignmentQuery = `
        INSERT INTO Slot_Assignment (academicyearid, school_id, department_id, program_id, school_code, school_abbreviation, school_name, dept_name, program_name, semester, course_code, section_no, slot, room, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *;
      `;
      const slotAssignmentData = [
        data.academicyearid, data.school_id, data.department_id, data.program_id, data.school_code, data.school_abbreviation, data.school_name, data.dept_name, data.program_name, data.semester, data.course_code, data.section_no, data.slot, data.room, data.status
      ];
      const slotAssignmentRes = await client.query(slotAssignmentQuery, slotAssignmentData);
      res.status(201).json(slotAssignmentRes.rows[0]);
    }
     else if (entity === "Room") {
      const roomQuery = `
        INSERT INTO Rooms (academicyearid, school_id, department_id, school_code, school_abbreviation, school_name, semester, room, block, room_type, capacity, status, dept_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *;
      `;
      const roomData = [
        data.academicyearid, data.school_id, data.department_id, data.school_code, data.school_abbreviation, data.school_name, data.semester, data.room, data.block, data.room_type, data.capacity, data.status, data.dept_name
      ];
      const roomRes = await client.query(roomQuery, roomData);
      res.status(201).json(roomRes.rows[0]);
    } else {
      res.status(400).send("Entity type not supported");
    }
    
  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});

// Corrected API endpoint to get academic year by ID
app.get('/academicyear/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query('SELECT * FROM academicyear WHERE academicyearid = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Academic year not found' });
    }
  } catch (error) {
    console.error('Error fetching academic year:', error);
    res.status(500).json({ error: 'Failed to fetch academic year' });
  }
});

// In your backend server (e.g., Express.js)
app.get('/academicyear', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM academicyear WHERE academicyearid = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Academic year not found' });
    }
  } catch (error) {
    console.error('Error fetching academic year:', error);
    res.status(500).json({ error: 'Failed to fetch academic year' });
  }
});

// API endpoint to update entity
app.put("/update-entity", async (req, res) => {
  const { entity, id, ...data } = req.body;
  console.log("Received update data:", req.body);

  try {
    if (entity === "Department") {
      const updateQuery = `
        UPDATE Departments
        SET academicyearid = $1, school_id = $2, school_code = $3, school_abbreviation = $4, school_name = $5, dept_name = $6, dept_abbreviation = $7, dept_code = $8, dept_tags = $9, established_year = $10, dept_type = $11, number_of_ug_programs = $12, number_of_pg_programs = $13, status = $14
        WHERE department_id = $15
        RETURNING *;
      `;
      const updateData = [
        data.academicyearid, data.school_id, data.school_code, data.school_abbreviation, data.school_name, data.dept_name, data.dept_abbreviation, data.dept_code, data.dept_tags, data.established_year, data.dept_type, data.number_of_ug_programs, data.number_of_pg_programs, data.status, id
      ];
      const updateRes = await client.query(updateQuery, updateData);
      res.status(200).json(updateRes.rows[0]);
    } else if (entity === "School") {
      const updateQuery = `
        UPDATE Schools
        SET academicyearid = $1,
        school_code = $2,
        school_name = $3, 
        school_abbreviation = $4, 
        school_tags = $5, 
        year_of_establishment = $6, 
        number_of_departments = $7, 
        status = $8
        WHERE school_id = $9
        RETURNING *;
      `;
      const updateData = [
        data.academicyearid, data.school_code, data.school_name, data.school_abbreviation,
        data.school_tags, data.year_of_establishment, data.number_of_departments,
        data.status, id
      ];
    
      console.log("Executing SQL query:");
      console.log(updateQuery);
      console.log("With data:");
      console.log(updateData);
    
      try {
        const updateRes = await client.query(updateQuery, updateData);
        console.log("Update result:", updateRes.rows); // Logs the updated row(s)
        res.json(updateRes.rows[0]);
      } catch (error) {
        console.error("Error executing update query:", error);
        res.status(500).json({ error: "Failed to update record" });
      }
    }
    
     else if (entity === "Program") {
      const updateQuery = `
        UPDATE Programs
        SET academicyearid = $1, school_id = $2, department_id = $3, school_code = $4, school_abbreviation = $5, school_name = $6, dept_name = $7, program_code = $8, program_abbreviation = $9, program_name = $10, program_credits = $11, year_of_launch = $12, duration = $13, status = $14
        WHERE program_id = $15
        RETURNING *;
      `;
      const updateData = [
        data.academicyearid, data.school_id, data.department_id, data.school_code, data.school_abbreviation, data.school_name, data.dept_name, data.program_code, data.program_abbreviation, data.program_name, data.program_credits, data.year_of_launch, data.duration, data.status, id
      ];
      const updateRes = await client.query(updateQuery, updateData);
      res.status(200).json(updateRes.rows[0]);
    } else if (entity === "Employee") {
      const updateQuery = `
        UPDATE Employee
        SET academicyearid = $1, school_id = $2, department_id = $3, school_code = $4, school_abbreviation = $5, school_name = $6, employee_code = $7, employee_name = $8, email_id = $9, contact_number = $10, status = $11, dept_name = $12
        WHERE employee_id = $13
        RETURNING *;
      `;
      const updateData = [
        data.academicyearid, data.school_id, data.department_id, data.school_code, data.school_abbreviation, data.school_name, data.employee_code, data.employee_name, data.email_id, data.contact_number, data.status, data.dept_name, id
      ];
      const updateRes = await client.query(updateQuery, updateData);
      res.status(200).json(updateRes.rows[0]);
    }
     else if (entity === "Student") {
      const updateQuery = `
        UPDATE Students
        SET academicyearid = $1, school_id = $2, department_id = $3, program_id = $4, school_code = $5, school_abbreviation = $6, school_name = $7, student_code = $8, student_name = $9, email_id = $10, contact_number = $11, status = $12, dept_name = $13, program_name = $14
        WHERE student_id = $15
        RETURNING *;
      `;
      const updateData = [
        data.academicyearid, data.school_id, data.department_id, data.program_id, data.school_code, data.school_abbreviation, data.school_name, data.student_code, data.student_name, data.email_id, data.contact_number, data.status, data.dept_name, data.program_name, id
      ];
      const updateRes = await client.query(updateQuery, updateData);
      res.status(200).json(updateRes.rows[0]);
    }
     else if (entity === "Program_Structure") {
      const updateQuery = `
        UPDATE program_structure
        SET academicyearid = $1, school_id = $2, department_id = $3, program_id = $4, school_code = $5, school_abbreviation = $6, school_name = $7, dept_name = $8, program_name = $9, semester = $10, course_code = $11, course_title = $12, lecture_hours = $13, tutorial_hours = $14, practical_hours = $15, total_hours = $16, credits = $17, marks = $18
        WHERE structure_id = $19
        RETURNING *;
      `;
      const updateData = [
        data.academicyearid, data.school_id, data.department_id, data.program_id, data.school_code, data.school_abbreviation, data.school_name, data.dept_name, data.program_name, data.semester, data.course_code, data.course_title, data.lecture_hours, data.tutorial_hours, data.practical_hours, data.total_hours, data.credits, data.marks, id
      ];
      const updateRes = await client.query(updateQuery, updateData);
      res.status(200).json(updateRes.rows[0]);
    }
     else if (entity === "Slot_Assignment") {
      const updateQuery = `
        UPDATE Slot_Assignment
        SET academicyearid = $1, school_id = $2, department_id = $3, program_id = $4, school_code = $5, school_abbreviation = $6, school_name = $7, dept_name = $8, program_name = $9, semester = $10, course_code = $11, section_no = $12, slot = $13, room = $14, status = $15
        WHERE assignment_id = $16
        RETURNING *;
      `;
      const updateData = [
        data.academicyearid, data.school_id, data.department_id, data.program_id, data.school_code, data.school_abbreviation, data.school_name, data.dept_name, data.program_name, data.semester, data.course_code, data.section_no, data.slot, data.room, data.status, id
      ];
      const updateRes = await client.query(updateQuery, updateData);
      res.status(200).json(updateRes.rows[0]);
    }
     else if (entity === "Room") {
      const updateQuery = `
        UPDATE Rooms
        SET academicyearid = $1, school_id = $2, department_id = $3, school_code = $4, school_abbreviation = $5, school_name = $6, semester = $7, room = $8, block = $9, room_type = $10, capacity = $11, status = $12
        WHERE room_id = $13
        RETURNING *;
      `;
      const updateData = [
        data.academicyearid, data.school_id, data.department_id, data.school_code, data.school_abbreviation, data.school_name, data.semester, data.room, data.block, data.room_type, data.capacity, data.status, id
      ];
      const updateRes = await client.query(updateQuery, updateData);
      res.status(200).json(updateRes.rows[0]);
    } else {
      res.status(400).send("Entity type not supported");
    }
  } catch (err) {
    console.error("Error occurred:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});

// API endpoint for bulk upload
app.post("/bulk-upload", async (req, res) => {
  const { entity, data } = req.body;
  console.log("Received bulk upload data:", { entity, data });

  try {
    let insertQuery = '';
    let validData = [];
    let mappedData = [];

    switch(entity) {
      case 'Department':
        insertQuery = `
          INSERT INTO Departments (academicyearid, school_id, school_code, school_abbreviation, school_name, dept_name, dept_abbreviation, dept_code, dept_tags, established_year, dept_type, number_of_ug_programs, number_of_pg_programs, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *;
        `;
        validData = data.filter(row =>
          row.academicyearid && row.school_id && row.school_code && row.school_abbreviation && row.school_name &&
          row.dept_name && row.dept_abbreviation && row.dept_code !== undefined &&
          row.dept_tags !== undefined && row.established_year && row.number_of_ug_programs &&
          row.number_of_pg_programs !== undefined && row.status
        );
        mappedData = validData.map(row => [
          row.academicyearid, row.school_id, row.school_code, row.school_abbreviation, row.school_name,
          row.dept_name, row.dept_abbreviation, row.dept_code, row.dept_tags,
          row.established_year, row.dept_type, row.number_of_ug_programs,
          row.number_of_pg_programs, row.status
        ]);
        break;
      
        
        case 'School':
          insertQuery = `
            INSERT INTO Schools (academicyearid, school_name, school_code, school_abbreviation, school_tags, year_of_establishment, number_of_departments, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
          `;
          validData = data.filter(row =>
            row.academicyearid && row.school_name && row.school_code && row.school_abbreviation &&
            row.school_tags !== undefined && row.year_of_establishment && row.number_of_departments !== undefined && row.status
          );
          mappedData = validData.map(row => [
            row.academicyearid, row.school_name, row.school_code, row.school_abbreviation, row.school_tags,
            row.year_of_establishment, row.number_of_departments, row.status
          ]);
          break;

case 'Program':
  insertQuery = `
    INSERT INTO Programs (academicyearid, school_id, department_id, dept_name, school_code, school_abbreviation, school_name, program_code, program_abbreviation, program_name, program_credits, year_of_launch, duration, status, intake)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *;
  `;
  validData = data.filter(row =>
    row.academicyearid && row.school_id && row.department_id && row.dept_name && row.school_code && row.school_abbreviation &&
    row.school_name && row.program_code && row.program_abbreviation && row.program_name &&
    row.program_credits !== undefined && row.year_of_launch && row.duration !== undefined && row.status && row.intake !== undefined
  );
  mappedData = validData.map(row => [
    row.academicyearid, row.school_id, row.department_id, row.dept_name, row.school_code, row.school_abbreviation,
    row.school_name, row.program_code, row.program_abbreviation, row.program_name,
    row.program_credits, row.year_of_launch, row.duration, row.status, row.intake
  ]);
  break;

          

      case 'Employees':
        insertQuery = `
          INSERT INTO Employee (academicyearid, school_id, department_id, school_code, school_abbreviation, school_name, employee_code, employee_name, email_id, contact_number, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *;
        `;
        validData = data.filter(row =>
          row.academicyearid && row.school_id && row.department_id && row.school_code && row.school_abbreviation &&
          row.school_name && row.employee_code && row.employee_name &&
          row.email_id && row.contact_number && row.status
        );
        mappedData = validData.map(row => [
          row.academicyearid, row.school_id, row.department_id, row.school_code, row.school_abbreviation,
          row.school_name, row.employee_code, row.employee_name, row.email_id, row.contact_number, row.status
        ]);
        break;

      case 'Students':
        insertQuery = `
          INSERT INTO Students (academicyearid, school_id, department_id, program_id, school_code, school_abbreviation, school_name, student_code, student_name, email_id, contact_number, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *;
        `;
        validData = data.filter(row =>
          row.academicyearid && row.school_id && row.department_id && row.program_id && row.school_code &&
          row.school_abbreviation && row.school_name && row.student_code &&
          row.student_name && row.email_id && row.contact_number && row.status
        );
        mappedData = validData.map(row => [
          row.academicyearid, row.school_id, row.department_id, row.program_id, row.school_code,
          row.school_abbreviation, row.school_name, row.student_code, row.student_name, row.email_id, row.contact_number, row.status
        ]);
        break;

        case 'Program_Structure':
          insertQuery = `
            INSERT INTO Program_Structure (academicyearid, school_id, department_id, program_id, school_code, school_abbreviation, school_name, course_code, course_title, lecture_hours, tutorial_hours, practical_hours, total_hours, credits, marks, semester_name, program_name, dept_name)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            RETURNING *;
          `;
          validData = data.filter(row =>
            row.academicyearid && row.school_id && row.department_id && row.program_id && row.school_code &&
            row.school_abbreviation && row.school_name &&
            row.course_code && row.course_title && row.lecture_hours !== undefined && row.tutorial_hours !== undefined &&
            row.practical_hours !== undefined && row.total_hours !== undefined && row.credits !== undefined && row.marks !== undefined &&
            row.semester_name && row.program_name && row.dept_name
          );
          mappedData = validData.map(row => [
            row.academicyearid, row.school_id, row.department_id, row.program_id, row.school_code,
            row.school_abbreviation, row.school_name, row.course_code, row.course_title,
            row.lecture_hours, row.tutorial_hours, row.practical_hours, row.total_hours, row.credits, row.marks, row.semester_name, row.program_name, row.dept_name
          ]);
          break;
        

      case 'Slot_Assignment':
        insertQuery = `
          INSERT INTO Slot_Assignment (academicyearid, school_id, department_id, program_id, school_code, school_abbreviation, school_name, semester, course_code, section_no, slot, room, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *;
        `;
        validData = data.filter(row =>
          row.academicyearid && row.school_id && row.department_id && row.program_id && row.school_code &&
          row.school_abbreviation && row.school_name && row.semester !== undefined &&
          row.course_code && row.section_no && row.slot && row.room && row.status
        );
        mappedData = validData.map(row => [
          row.academicyearid, row.school_id, row.department_id, row.program_id, row.school_code,
          row.school_abbreviation, row.school_name, row.semester, row.course_code, row.section_no, row.slot, row.room, row.status
        ]);
        break;

      case 'Rooms':
        insertQuery = `
          INSERT INTO Rooms (academicyearid, school_id, department_id, school_code, school_abbreviation, school_name, semester, room, block, room_type, capacity, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *;
        `;
        validData = data.filter(row =>
          row.academicyearid && row.school_id && row.department_id && row.school_code &&
          row.school_abbreviation && row.school_name && row.semester && row.room && row.block &&
          row.room_type && row.capacity !== undefined && row.status
        );
        mappedData = validData.map(row => [
          row.academicyearid, row.school_id, row.department_id, row.school_code,
          row.school_abbreviation, row.school_name, row.semester, row.room, row.block,
          row.room_type, row.capacity, row.status
        ]);
        break;

      default:
        return res.status(400).send("Entity type not supported");
    }

    const results = await Promise.allSettled(mappedData.map(row => client.query(insertQuery, row)));

    const insertedRows = results.filter(result => result.status === 'fulfilled').map(result => result.value.rows[0]);
    res.status(201).json(insertedRows);

  } catch (err) {
    console.error("Error occurred during bulk upload:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      console.log('User not found:', username); // Log for debugging
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = result.rows[0];
    console.log('User found:', user); // Debugging log
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for user:', username); // Log for debugging
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log('Password match for user:', username); // Debugging log
    const token = jwt.sign(
      { id: user.user_id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: '1h' }
    );
    // Include username and user_id in the response
    res.json({ token, role: user.role, username: user.username, user_id: user.user_id });
  } catch (err) {
    console.error('Server error:', err); // Log the error for debugging
    res.status(500).send('Server error: ' + err.message);
  }
});


function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Received token:', token); // Debugging log
  if (!token) {
    console.log('No token provided'); // Debugging log
    return res.sendStatus(401);
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      console.log('Token verification error:', err); // Debugging log
      return res.sendStatus(403);
    }
    console.log('Verified user:', user); // Debugging log
    req.user = user;
    next();
  });
}

app.get('/api/protected', authenticateToken, (req, res) => {
  console.log('Protected route accessed by user:', req.user); // Debugging log
  res.json({ message: 'This is a protected route for ' + req.user.role });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
