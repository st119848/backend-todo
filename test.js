const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json()); // ต้องมาก่อน route​

app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.get('/api/todos/stats', (req,res) => {
    res.json({data : {total: 0}})
})

app.get('/api/todos/:id', (req,res) => {
    res.json({data : {id: req.params.id}})
})
app.patch('/api/todos/:id', (req, res) => {
    res.json({
        params: req.params,
        query: req.query,
        body: req.body,
    })
})
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
