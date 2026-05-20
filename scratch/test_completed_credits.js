fetch('http://localhost:3000/api/training-info')
  .then(res => res.json())
  .then(data => {
    console.log('--- CURRICULUM ORDER ---');
    console.log(data.curriculumOrder);
    console.log('Total subjects in curriculumOrder:', data.curriculumOrder.length);
  })
  .catch(console.error);
