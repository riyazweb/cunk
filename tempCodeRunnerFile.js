const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;

const atlasConnectionString = `mongodb+srv://theriyazsonu:mdriyazsonu39709@projectx.3q4h6mt.mongodb.net/test?retryWrites=true&w=majority`;

mongoose.connect(atlasConnectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// BioData model
const bioDataSchema = new mongoose.Schema({
  name: String,
});

const BioData = mongoose.model('BioData', bioDataSchema);

// Color model (for storing the last clicked color and time)
const colorSchema = new mongoose.Schema({
  lastClickedColor: String,
  lastUpdatedTime: { type: Date, default: Date.now },
});

const Color = mongoose.model('Color', colorSchema);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set HTML as the view engine
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
// Set the views path to the current directory
app.set('views', __dirname);

// Routes
app.route('/')
  .get(async (req, res) => {
    try {
      const latestBioData = await BioData.findOne().sort({ _id: -1 });
      const latestColor = await Color.findOne().sort({ lastUpdatedTime: -1 });
      const currentColor = latestColor ? latestColor.lastClickedColor : 'green';
      const lastUpdatedTime = latestColor ? latestColor.lastUpdatedTime : null;

      const colors = ['green', 'blue', 'red', 'yellow'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      if (latestBioData) {
        res.render('index.html', { latestBioData: latestBioData.name, currentColor, lastUpdatedTime, randomColor });
      } else {
        res.render('index.html', { latestBioData: 'No data available', currentColor, lastUpdatedTime, randomColor });
      }
    } catch (err) {
      console.error(err);
    }
  })

  .post(async (req, res) => {
    const { bioData } = req.body;

    try {
      const bioDataEntry = new BioData({
        name: bioData,
      });

      await bioDataEntry.save();
      res.redirect('/');
    } catch (err) {
      console.error(err);
    }
  });

// Route to handle class mode submissions
app.post('/submitClassMode', async (req, res) => {
  const { classMode } = req.body;

  try {
    // Update MongoDB with the submitted class mode and current time
    const currentTime = new Date();
    await Color.findOneAndUpdate({}, { lastClickedColor: classMode, lastUpdatedTime: currentTime }, { upsert: true });

    // Retrieve the latest data from MongoDB
    const latestColor = await Color.findOne().sort({ lastUpdatedTime: -1 });
    const currentColor = latestColor ? latestColor.lastClickedColor : 'green';
    const lastUpdatedTime = latestColor ? latestColor.lastUpdatedTime : null;

    // Send the updated data back to the client
    res.send({
      message: 'Class mode submitted successfully',
      currentColor,
      lastUpdatedTime,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
