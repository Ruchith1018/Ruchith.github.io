// projects-data.js — every project on the Projects page.
//
// Fields:
//   id        URL hash for deep links (projects.html#<id>)
//   featured  shown as the large card at the top
//   domains   drive the filter buttons
//   summary   one or two sentences on the tile
//   team / guide / course   shown in the detail popup when known
//   details   HTML write-up for the detail popup
//   readme    optional raw README URL, offered as an extra section in the popup
//
// Write-ups are based on each project's report, slides, code and notebook outputs.

const GH1 = 'https://github.com/Ruchith1018/Btech-1stYear/tree/main/';
const GH2 = 'https://github.com/Ruchith1018/Btech-2ndYear/tree/main/';
const GH3 = 'https://github.com/Ruchith1018/Btech-3rdYear/tree/main/';
const TRIO = ['Sai Abhishek B', 'Ruchith Balaji B', 'Hari Chillakuru'];

const PROJECTS = [
  {
    id: 'meridian-swot',
    featured: true,
    title: 'Meridian SWOT Intelligence',
    kind: 'Professional Project',
    date: 'Apr 2026',
    cover: 'images/covers/meridian.jpg',
    domains: ['GenAI & LLMs', 'Full Stack'],
    summary: 'Type a company name or ticker and get a SWOT report built from its latest SEC 10-K: 29 analysis areas, 206 analyst questions, and a web search whenever the filing can\'t answer.',
    skills: ['Python', 'FastAPI', 'LangChain', 'RAG', 'PGVector', 'Supabase', 'PostgreSQL', 'NVIDIA NIM', 'Llama 3.3 70B', 'Tavily', 'Server-Sent Events', 'BeautifulSoup', 'fpdf2'],
    links: {
      github: 'https://github.com/Ruchith1018/SWOT_ANALYSIS',
      live: 'https://swot-analysis-u8ba.vercel.app/',
      blog: '../Blog/building-meridian-swot-rag/index.html',
    },
    readme: {
      url: 'https://raw.githubusercontent.com/Ruchith1018/SWOT_ANALYSIS/master/README.md',
      base: 'https://raw.githubusercontent.com/Ruchith1018/SWOT_ANALYSIS/master/',
    },
    details: `
      <h3>Overview</h3>
      <p>A SWOT analysis of a public company is mostly reading. The facts are spread through a 10-K filing that often runs past a hundred pages: risk factors, segment results, legal proceedings, management's discussion. Meridian does that reading. You type a company name or ticker, choose which parts of the analysis you want, and it produces a structured Strengths / Weaknesses / Opportunities / Threats report, streamed to the page as it's written and downloadable as a PDF.</p>
      <p>It's a full application, not a notebook: a FastAPI backend, a vanilla-JS frontend and a Postgres vector store, deployed with a public live site.</p>

      <h3>How a report gets made</h3>
      <h4>1. Find the company</h4>
      <p>People don't type tickers consistently, so the name goes through three passes. First a table of 66 common aliases ("google" → GOOGL, "facebook" → META, "j&amp;j" → JNJ), with fuzzy matching to catch typos. Then exact, partial and fuzzy matching against the SEC's official company-ticker list. Only if all of that fails is the input used as a ticker as typed.</p>
      <h4>2. Fetch and clean the filing</h4>
      <p>The latest 10-K is downloaded from SEC EDGAR. BeautifulSoup strips scripts, styles and the hidden inline-XBRL blocks, and flattens every table into pipe-separated rows. That last step matters: financial tables are where many of the answers are, and naive HTML-to-text conversion destroys them.</p>
      <h4>3. Chunk, embed and cache</h4>
      <p>The cleaned text is split into 800-character chunks with 100 characters of overlap, embedded with NVIDIA's <code>nv-embedqa-e5-v5</code> model, and written to PGVector on Supabase in batches of 100, with progress streamed to the browser. Each company gets its own collection. If that collection already exists, the fetch-and-embed step is skipped entirely, so a second report on the same company starts immediately.</p>
      <h4>4. Ask the right questions</h4>
      <p>The analysis framework is the core of the project: <strong>29 subcategories and 206 analyst-style questions</strong>, each subcategory with its own instruction for how its summary should be written.</p>
      <table>
        <thead><tr><th>Section</th><th>Subcategories</th></tr></thead>
        <tbody>
          <tr><td>Strengths (10)</td><td>R&amp;D focus, financial strengths, credit ratings, brand value, product/service spread, market position, geographic reach, customer base &amp; digital strength, order-book health, CET values</td></tr>
          <tr><td>Weaknesses (5)</td><td>Legal issues, product/service issues, incidents &amp; accidents, operational issues, financial issues</td></tr>
          <tr><td>Opportunities (5)</td><td>Launches &amp; market expansion, industry opportunity, partnerships, acquisitions &amp; regulatory milestones, digital transformation</td></tr>
          <tr><td>Threats (7)</td><td>Regulation, competition, raw-material prices, cybersecurity, wages, natural calamities, supplier dependence</td></tr>
          <tr><td>Plus</td><td>Company overview and a general section</td></tr>
        </tbody>
      </table>
      <h4>5. Retrieve with MMR</h4>
      <p>For every question in a subcategory, the retriever uses Maximal Marginal Relevance: it takes the 30 closest chunks, then picks 8 that are relevant <em>and</em> different from each other. 10-Ks repeat themselves heavily, and plain similarity search tends to return five copies of the same paragraph. Chunks from all of a subcategory's questions are pooled and de-duplicated into one context.</p>
      <h4>6. Check before answering</h4>
      <p>Before writing anything, Llama 3.3 70B (served through NVIDIA NIM) is asked whether that context is enough to answer <em>all</em> of the subcategory's questions. It replies either <code>YES</code> or with the exact search query it would use to find what's missing. That query goes to Tavily, and the results are added to the context in a clearly separated "Internet Search Results" block. Because the model writes the query itself, the search targets the specific gap rather than the topic in general. This matters most for Opportunities and Threats, where a company's own filing is thin on the outside world.</p>
      <h4>7. One call per subcategory</h4>
      <p>A single generation call answers every question in the subcategory (saying "Information not found" where it must) and then writes the summary paragraph from those answers. Batching this way cuts the number of LLM calls from one per question to one per subcategory, without losing the per-question reasoning.</p>

      <h3>Engineering details</h3>
      <ul>
        <li><strong>Live progress.</strong> Both long operations, fetch-and-embed and analysis, stream Server-Sent Events. The heavy work runs on a background thread that feeds an asyncio queue, so the UI shows each step as it happens ("Gathering data for…", "Searching internet for missing data: …").</li>
        <li><strong>Stop button.</strong> A <code>threading.Event</code> is checked between questions, so a user can cancel a long report cleanly.</li>
        <li><strong>Rate limits.</strong> LLM calls retry with exponential backoff (4 s up to 120 s, at most 20 attempts), and each wait is reported in the UI instead of the page silently stalling.</li>
        <li><strong>Reports.</strong> The finished analysis is rendered to PDF with fpdf2 and stored in Postgres per session, with a cleanup endpoint to delete a session's data.</li>
      </ul>

      <h3>What I'd add next</h3>
      <ul>
        <li>Citations on every claim, linking to the 10-K section or web page it came from.</li>
        <li>Year-over-year comparison of filings: a risk that's new this year matters more than one that's been there for a decade.</li>
        <li>A small evaluation set of companies with reference SWOTs, so prompt and retrieval changes can be scored instead of judged by eye.</li>
      </ul>`,
  },

  {
    id: 'space-invaders-rl',
    title: 'RL Agent for Space Invaders',
    kind: 'Course Project · Research manuscript',
    date: 'May 2024',
    cover: 'images/covers/space-invaders-rl.jpg',
    domains: ['Reinforcement Learning'],
    team: ['Ruchith Balam (first author)', 'Abhishek Busetty', 'Hari Chillakuru', 'Uday Aira'],
    guide: 'Dr. Nippun Kumaar A. A.',
    course: 'Reinforcement Learning',
    summary: 'Space Invaders agents usually only move left and right. We gave the ship vertical movement, tuned DQN, and compared it with PPO over 10 million timesteps. Vertical movement lifted PPO\'s mean reward by 52%.',
    skills: ['Python', 'Stable Baselines', 'TensorFlow', 'OpenAI Gym', 'Pygame', 'OpenCV', 'DQN', 'PPO', 'Hyperparameter Tuning'],
    links: { github: GH3 + 'RL%20based%20agent%20for%20Space%20Invaders' },
    details: `
      <h3>Overview</h3>
      <p>Space Invaders is a standard reinforcement-learning benchmark, but in almost every implementation the ship can only slide left and right along the bottom of the screen. That one-dimensional action space limits how much an agent can explore and how it can dodge. We built our own Space Invaders environment where the ship can also move up and down, then measured how much the extra freedom helps two standard algorithms: Deep Q-Networks (DQN) and Proximal Policy Optimization (PPO).</p>
      <p>The work is written up as a research manuscript, <em>"An Optimized Comparative Analysis of DQN and PPO for Space Invaders"</em>, on which I'm first author.</p>

      <h3>The environment</h3>
      <p>Rather than use the Atari version, we wrote the game in Pygame (ship, enemy waves, bullets) and wrapped it as a custom OpenAI Gym environment, <code>SpaceENV</code>, so the action space could be changed.</p>
      <ul>
        <li><strong>Screen:</strong> 500×500 pixels at 30 frames per second, with episodes capped at 5,000 steps.</li>
        <li><strong>Observation:</strong> the last three frames, each converted to greyscale and resized to 84×84, stacked into one 252×84 input, so the agent can see motion and not just a still image.</li>
        <li><strong>Actions:</strong> 18 discrete actions, covering every combination of staying still, the four directions and the diagonals, each with or without firing.</li>
        <li><strong>Reward:</strong> −0.001 per frame (to discourage stalling), −0.001 per shot (to discourage spraying bullets), +1 per enemy destroyed, and −2 for losing.</li>
      </ul>

      <h3>Method</h3>
      <h4>1. Tune DQN on the classic game</h4>
      <p>With horizontal movement only, we compared three settings of learning rate and exploration fraction, training each for 10,000 episodes:</p>
      <table>
        <thead><tr><th>Set</th><th>Learning rate</th><th>Exploration fraction</th><th>Mean reward</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>0.00025</td><td>0.025</td><td>−0.569</td></tr>
          <tr><td>2</td><td>0.00050</td><td>0.050</td><td>−0.578</td></tr>
          <tr><td>3</td><td>0.00075</td><td>0.075</td><td>−0.581</td></tr>
        </tbody>
      </table>
      <p>Raising both together made results steadily worse. Set 1 also had the fewest sharp negative dips, so we used it for everything that followed.</p>
      <h4>2. Train both algorithms, with and without vertical movement</h4>
      <p>DQN used a CNN policy with a 10,000-step replay buffer, <strong>prioritized experience replay</strong> (α = 0.6), a target network updated every 1,000 steps, updates every 4 steps, and ε decaying to 0.01. Each configuration trained for 10 million timesteps in Stable Baselines, checkpointing whenever the 50-episode average reward hit a new best. PPO trained on the same environment with the same budget.</p>

      <h3>Results</h3>
      <p>Mean training reward over 10 million timesteps:</p>
      <table>
        <thead><tr><th>Action space</th><th>DQN</th><th>PPO</th></tr></thead>
        <tbody>
          <tr><td>Horizontal only</td><td>12.57</td><td>13.69</td></tr>
          <tr><td>Horizontal + vertical</td><td>14.60 (+16%)</td><td>20.83 (+52%)</td></tr>
        </tbody>
      </table>
      <p>On the reward curves, the vertical-movement agents pulled ahead of the horizontal-only ones after about 6 million timesteps for DQN, but after only about 2 million for PPO.</p>
      <p>Tested over 200 episodes with vertical movement:</p>
      <table>
        <thead><tr><th>Agent</th><th>Average score</th><th>Best score</th></tr></thead>
        <tbody>
          <tr><td>PPO</td><td>24.48</td><td>175</td></tr>
          <tr><td>DQN</td><td>17.55</td><td>139</td></tr>
          <tr><td>Random policy</td><td>7.45</td><td>34</td></tr>
        </tbody>
      </table>
      <p>PPO's average was 39% higher than DQN's and its best score 26% higher. Both learned agents beat random play by a wide margin.</p>

      <h3>Takeaways</h3>
      <ul>
        <li>A bigger action space helped both algorithms, but PPO made far better use of it, and much sooner.</li>
        <li>In this setup, lower learning rates and less exploration were better. Aggressive settings mostly added instability.</li>
      </ul>
      <h3>Future work</h3>
      <p>Wider hyperparameter searches for both algorithms, and transfer learning so skills learned on one level carry over to harder ones without retraining from scratch.</p>
      <h3>In the repo</h3>
      <p>The Pygame game and Gym environment, DQN and PPO training scripts, scripts to run each trained agent and a random baseline, per-episode score logs, the course report, the slides and the manuscript.</p>`,
  },

  {
    id: 'sarcasm-detection',
    title: 'Sarcasm Detection with BERT + GCN',
    kind: 'Course Project',
    date: 'May 2024',
    cover: 'images/covers/sarcasm-detection.jpg',
    domains: ['NLP', 'Deep Learning'],
    team: TRIO,
    summary: 'Combines BERT\'s contextual embeddings with a graph network over each sentence\'s grammar and emotional weight to spot sarcastic headlines. 90.8% test accuracy, 0.90 F1.',
    skills: ['Python', 'PyTorch', 'BERT', 'Graph Convolutional Networks', 'spaCy', 'SenticNet', 'NLP'],
    links: { github: GH3 + 'Sarcasm%20Detection%20using%20BERT%20and%20GCN' },
    details: `
      <h3>Overview</h3>
      <p>Sarcasm says the opposite of what it means, which breaks most sentiment systems: "Great, another Monday" is full of positive words. Detecting it matters for anything that reads opinion at scale, like social-media monitoring, review analysis or customer feedback. This project combines two kinds of signal. BERT captures what each word means in context, and a Graph Convolutional Network (GCN) captures how the words relate to each other.</p>

      <h3>Why a graph?</h3>
      <p>Sarcasm usually lives in a <em>relationship</em> between parts of a sentence: a positive phrase attached to a negative situation, or praise aimed at something that plainly doesn't deserve it. A sequence model sees words in order. A graph built from the sentence's grammar connects words that relate to each other, even when they're far apart.</p>

      <h3>Data</h3>
      <table>
        <thead><tr><th>Corpus</th><th>Train (sarcastic / not)</th><th>Test (sarcastic / not)</th></tr></thead>
        <tbody>
          <tr><td>News headlines (The Onion vs HuffPost)</td><td>2,516 / 2,504</td><td>570 / 410</td></tr>
          <tr><td>Riloff tweets</td><td>215 / 1,153</td><td>93 / 495</td></tr>
        </tbody>
      </table>
      <p>The headline set is balanced and professionally written, which avoids the labelling noise of self-tagged #sarcasm tweets. The reported results are on headlines.</p>

      <h3>Model</h3>
      <ol>
        <li><strong>BERT encoding.</strong> Each headline is wrapped in <code>[CLS] … [SEP]</code>, padded or truncated to 85 tokens, and passed through <code>bert-base-uncased</code> to get a 768-dimensional embedding per token.</li>
        <li><strong>Graph construction.</strong> spaCy (<code>en_core_web_sm</code>) parses each sentence, and two adjacency matrices are built:
          <ul>
            <li>a <strong>dependency graph</strong>: an edge between every word and its grammatical children, plus self-loops;</li>
            <li>an <strong>affective graph</strong>: the same structure, but each edge weighted by the word's SenticNet sentiment score, so emotionally loaded words carry more weight.</li>
          </ul>
        </li>
        <li><strong>Graph convolution.</strong> GCN layers pass information along those edges, starting from the BERT embeddings, so each word's representation absorbs its grammatical and emotional neighbourhood.</li>
        <li><strong>Classification.</strong> The graph features are combined with the BERT output and passed to a classifier that labels the headline sarcastic or not.</li>
      </ol>
      <p>Training used Adam (learning rate 2×10⁻⁵), dropout 0.1, L2 regularisation 10⁻⁵ and Xavier initialisation, for about 112 million trainable parameters.</p>

      <h3>Results</h3>
      <table>
        <thead><tr><th>Split</th><th>Accuracy</th><th>F1</th></tr></thead>
        <tbody>
          <tr><td>Validation</td><td>88.0%</td><td>0.874</td></tr>
          <tr><td><strong>Test</strong></td><td><strong>90.8%</strong></td><td><strong>0.903</strong></td></tr>
        </tbody>
      </table>
      <p>Training accuracy reached about 98–99% by the last epochs, against 91% on test, so the model was overfitting somewhat. With 5,000 training headlines and a 110M-parameter encoder, that's not surprising.</p>

      <h3>What I'd do differently</h3>
      <ul>
        <li>Train a BERT-only baseline on the same split. Without it, we can't say how much of the 90.8% the graph component actually adds.</li>
        <li>Use stronger regularisation or freeze the lower BERT layers to narrow the train/test gap.</li>
      </ul>
      <h3>In the repo</h3>
      <p>Graph-generation scripts (dependency, sentic and combined), data loaders, an inference script for classifying new text, the full training log, both datasets, the report and the slides.</p>`,
  },

  {
    id: 'drone-detection',
    title: 'Drone Intrusion Detection',
    kind: 'Course Project',
    date: 'May 2024',
    cover: 'images/covers/drone-detection.jpg',
    domains: ['Computer Vision', 'Deep Learning'],
    team: TRIO,
    guide: 'Dr. Rimjhim Padam Singh',
    summary: 'Tells drones apart from birds, the hard case for any airspace alarm. Compared four CNNs, then added self-attention to the best one (InceptionV3), reaching 97.7% test accuracy.',
    skills: ['Python', 'TensorFlow', 'Keras', 'Transfer Learning', 'InceptionV3', 'ResNet50', 'DenseNet', 'Multi-Head Attention', 'Data Augmentation'],
    links: { github: GH3 + 'Drone%20Intrusion%20Detection%20using%20Deep%20Learning' },
    details: `
      <h3>Overview</h3>
      <p>Cheap drones have made restricted airspace (airports, military sites, prisons, farms) much harder to protect. Camera-based detection is an obvious answer, but a small drone at a distance looks a lot like a bird, and a system that can't tell the two apart either misses intrusions or raises alarms all day. We framed it as a binary image classification problem, drone or bird, and compared deep learning architectures to find the most reliable one.</p>

      <h3>Data</h3>
      <p>4,000 images split 60/20/20 with equal classes:</p>
      <table>
        <thead><tr><th>Class</th><th>Train</th><th>Validation</th><th>Test</th></tr></thead>
        <tbody>
          <tr><td>Drone</td><td>1,400</td><td>460</td><td>460</td></tr>
          <tr><td>Bird</td><td>1,400</td><td>460</td><td>460</td></tr>
        </tbody>
      </table>
      <p>Images were resized to 256×256 and augmented during training with random zoom (15%), horizontal shift (20%) and shear (15%), so the models wouldn't depend on exact framing.</p>

      <h3>Models</h3>
      <ul>
        <li><strong>CNN from scratch:</strong> stacked 3×3 convolutions with ReLU and max-pooling, two 128-unit dense layers and a softmax output. This is the baseline.</li>
        <li><strong>ResNet50</strong>, <strong>DenseNet</strong> and <strong>InceptionV3</strong>, pre-trained on ImageNet with their base layers frozen. Each gets a new head: global average pooling, a 1,024-unit ReLU layer (plus a 512-unit layer for Inception) and a 2-way softmax.</li>
        <li><strong>InceptionV3 + self-attention:</strong> one or two multi-head attention layers added to the Inception head. The attention lets the model weigh which parts of the feature map matter, such as rotor shapes versus wing shapes, before classifying.</li>
      </ul>
      <p>All models used batch size 32, the Adam optimiser and categorical cross-entropy, for 50 epochs.</p>

      <h3>Results</h3>
      <p>Test set (920 images):</p>
      <table>
        <thead><tr><th>Model</th><th>Accuracy</th><th>Precision</th><th>F1</th></tr></thead>
        <tbody>
          <tr><td>CNN (from scratch)</td><td>93.4%</td><td>89.9%</td><td>93.0%</td></tr>
          <tr><td>ResNet50</td><td>93.5%</td><td>89.7%</td><td>93.9%</td></tr>
          <tr><td>DenseNet</td><td>94.4%</td><td>87.9%</td><td>95.1%</td></tr>
          <tr><td>InceptionV3</td><td>96.8%</td><td>94.8%</td><td>96.9%</td></tr>
        </tbody>
      </table>
      <p>Adding attention to InceptionV3:</p>
      <table>
        <thead><tr><th>Variant</th><th>Train</th><th>Validation</th><th>Test</th></tr></thead>
        <tbody>
          <tr><td>InceptionV3</td><td>93.2%</td><td>85.1%</td><td>96.8%</td></tr>
          <tr><td>+ 1 attention layer</td><td>95.1%</td><td>94.3%</td><td>96.9%</td></tr>
          <tr><td>+ 2 attention layers</td><td>96.9%</td><td>99.0%</td><td><strong>97.7%</strong></td></tr>
        </tbody>
      </table>
      <p>The biggest gain from attention was stability. Validation accuracy rose from 85% to 99%, so the model's behaviour during training became much more consistent with how it performs on test data.</p>

      <h3>Takeaways</h3>
      <ul>
        <li>Pre-training matters on a dataset this small. Inception's multi-scale filters suited small, distant objects best.</li>
        <li>Attention added little to test accuracy, but made the model far more consistent.</li>
      </ul>
      <h3>Future work</h3>
      <p>Moving from classification to detection and tracking in video, so the system can locate a drone in a frame and follow it, and testing on footage from real surveillance cameras.</p>
      <h3>In the repo</h3>
      <p>One notebook per model (CNN, ResNet, DenseNet and three Inception variants), the paper and the slides.</p>`,
  },

  {
    id: 'text-readability',
    title: 'Text Readability for an AI Interview Bot',
    kind: 'Course Project',
    date: 'May 2024',
    cover: 'images/covers/text-readability.jpg',
    domains: ['NLP', 'Deep Learning'],
    team: ['Uday Aira', 'Ruchith Balaji B'],
    course: 'Natural Language Processing',
    summary: 'A transformer that scores how hard a passage is to read, built as one stage of an AI interview voice bot so the bot can match its questions to the candidate. Trained on CommonLit with repeated cross-validation.',
    skills: ['Python', 'PyTorch', 'Hugging Face Transformers', 'BERT', 'DistilBERT', 'Cross-Validation', 'Mixed Precision', 'Neptune'],
    links: { github: GH3 + 'Text%20Readability%20Detection' },
    details: `
      <h3>Overview</h3>
      <p>An interview bot that speaks to every candidate in the same register loses people: too complex and nervous or non-native speakers struggle, too simple and strong candidates feel patronised. This project builds the piece that lets a bot adapt: a model that reads text and predicts how difficult it is to understand.</p>

      <h3>Where it fits</h3>
      <p>The readability model is one stage of a six-step voice-bot pipeline designed in the project:</p>
      <ol>
        <li>Speech-to-text on the candidate's answer</li>
        <li>Pre-processing</li>
        <li>Emotion recognition</li>
        <li><strong>Readability prediction</strong> (this project)</li>
        <li>Question generation, adjusted to the candidate's level</li>
        <li>Text-to-speech for the bot's reply</li>
      </ol>

      <h3>Data</h3>
      <p>The <strong>CommonLit Readability</strong> dataset: 2,834 literary and informational passages, each with a continuous difficulty score assigned by teachers. Lower scores mean harder text. Passages run up to 314 tokens.</p>

      <h3>Model</h3>
      <ul>
        <li>A pre-trained transformer with a regression head that outputs one readability score. The report describes the pipeline with DistilBERT, a smaller, faster BERT suited to real-time use. The final training notebook uses a <code>bert-large-uncased</code> backbone.</li>
        <li><strong>Pooling:</strong> rather than the single <code>[CLS]</code> token, the head mean-pools token embeddings and concatenates the last four hidden layers, since readability depends on the whole passage.</li>
        <li><strong>Input:</strong> sequences up to 256 tokens, with the embedding layer frozen.</li>
      </ul>

      <h3>Training setup</h3>
      <table>
        <thead><tr><th>Setting</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td>Validation</td><td>5-fold CV, repeated 3 times, stratified on the target cut into 12 bins</td></tr>
          <tr><td>Per fold</td><td>2,267 train / 567 validation passages</td></tr>
          <tr><td>Loss</td><td>Mean squared error</td></tr>
          <tr><td>Optimiser</td><td>AdamW, learning rate 1e-4, weight decay 1e-3</td></tr>
          <tr><td>Layer-wise LR decay</td><td>×0.85 per layer, so lower layers change less</td></tr>
          <tr><td>Schedule</td><td>1 warm-up epoch, then cosine decay; 5 epochs per fold</td></tr>
          <tr><td>Augmentation</td><td>5% chance of shuffling sentence order within a passage</td></tr>
          <tr><td>Other</td><td>Mixed-precision (fp16), batch size 20, experiments tracked in Neptune</td></tr>
        </tbody>
      </table>
      <p>Stratifying on binned scores means every fold sees the full range from very easy to very hard. Layer-wise decay keeps the general language knowledge in the lower layers mostly intact while the top layers adapt to the task.</p>
      <p>The notebook in the repo is version 47 of the experiment. It records the setup and the start of a training run, but not final cross-validation scores, so I don't quote a number here.</p>

      <h3>In the repo</h3>
      <p>The training notebook, the paper and the slides.</p>`,
  },

  {
    id: 'tomato-leaf-disease',
    title: 'Tomato Leaf Disease Detection',
    kind: 'Course Project',
    date: 'Jan 2024',
    cover: 'images/covers/tomato-leaf-disease.jpg',
    domains: ['Computer Vision', 'Deep Learning'],
    team: ['Sai Abhishek B', 'Ruchith Balaji B'],
    guide: 'Dr. Nidhin Prabhakar T V, Dr. Rimjhim Padam Singh',
    summary: 'Classifies tomato leaf photos into six classes (healthy plus five diseases). Five architectures compared on 13,600 images; a plain CNN and ResNet50 both passed 99% accuracy.',
    skills: ['Python', 'TensorFlow', 'Keras', 'CNN', 'GAN', 'ResNet50', 'DenseNet', 'VGG16', 'Data Augmentation'],
    links: { github: GH3 + 'Tomato%20Lead%20Disease%20detection%20using%20Deep%20Learning' },
    details: `
      <h3>Overview</h3>
      <p>Tomato diseases show on the leaves before they ruin a crop, but recognising which disease it is takes expertise many farmers don't have on hand. A model that classifies a leaf photo could put that expertise on a phone. This project compares five deep learning approaches on the task to see what actually works best.</p>

      <h3>Data</h3>
      <p>13,603 leaf images in six classes:</p>
      <ul>
        <li>Bacterial spot</li>
        <li>Early blight</li>
        <li>Late blight</li>
        <li>Septoria leaf spot</li>
        <li>Yellow leaf curl virus</li>
        <li>Healthy</li>
      </ul>
      <p>11,108 images for training and 2,495 for validation. Images were resized, normalised and augmented before training.</p>

      <h3>Approaches</h3>
      <ul>
        <li><strong>CNN:</strong> a convolutional network trained from scratch. This is the baseline.</li>
        <li><strong>CNN + GAN:</strong> a generative adversarial network creates synthetic leaf images, which are added to the training set to help the CNN generalise.</li>
        <li><strong>ResNet50:</strong> residual connections let very deep networks train without the gradient fading away.</li>
        <li><strong>DenseNet:</strong> every layer connects to every later layer, which reuses features and keeps the parameter count low.</li>
        <li><strong>VGG16:</strong> a classic 16-layer network of uniform 3×3 convolutions.</li>
      </ul>

      <h3>Results</h3>
      <table>
        <thead><tr><th>Model</th><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1</th></tr></thead>
        <tbody>
          <tr><td>CNN</td><td><strong>99.42%</strong></td><td>97.46%</td><td>94.17%</td><td>95.79%</td></tr>
          <tr><td>ResNet50</td><td>99.35%</td><td><strong>98.85%</strong></td><td>91.79%</td><td>95.38%</td></tr>
          <tr><td>VGG16</td><td>98.35%</td><td>97.34%</td><td>98.34%</td><td>93.93%</td></tr>
          <tr><td>CNN + GAN</td><td>96.51%</td><td>91.54%</td><td>91.57%</td><td>87.89%</td></tr>
          <tr><td>DenseNet</td><td>95.12%</td><td>95.48%</td><td><strong>97.91%</strong></td><td>92.01%</td></tr>
        </tbody>
      </table>

      <h3>What the comparison showed</h3>
      <ul>
        <li><strong>The simple CNN was as good as anything.</strong> On clean, centred leaf photos, the extra depth of the big pre-trained networks bought almost nothing.</li>
        <li><strong>GAN augmentation hurt.</strong> The synthetic leaves apparently weren't realistic enough to help, and they pulled accuracy down by about 3 points.</li>
        <li><strong>DenseNet had the best recall and was the fastest to train.</strong> If missing a diseased plant costs more than a false alarm, it's the model to pick despite its lower accuracy.</li>
      </ul>

      <h3>Future work</h3>
      <ul>
        <li>Robustness to real field conditions: varied lighting, cluttered backgrounds and different growth stages, through domain adaptation.</li>
        <li>Faster inference and small models that run on a phone or edge device, for farms without reliable internet.</li>
        <li>Multispectral imaging, to catch stress before it's visible to the eye.</li>
      </ul>
      <h3>In the repo</h3>
      <p>One notebook per model (CNN, CNN-GAN, ResNet, DenseNet, VGG16), the report and the slides.</p>`,
  },

  {
    id: 'spam-filter',
    title: 'Email Spam Filter (Naive Bayes)',
    kind: 'Course Project',
    date: 'Jan 2024',
    cover: 'images/covers/spam-filter.jpg',
    domains: ['Machine Learning', 'NLP'],
    team: TRIO,
    summary: 'A Naive Bayes spam filter written from scratch, with no ML library. Trained on 2,000 emails and tested on 800: 91.3% accuracy, with only 6 of 400 real emails wrongly flagged.',
    skills: ['Python', 'Naive Bayes', 'Bayesian Networks', 'Text Processing', 'Probability'],
    links: { github: GH3 + 'Spam%20Mail%20Detection%20using%20Bayes%20Networks' },
    details: `
      <h3>Overview</h3>
      <p>A spam filter built from first principles to understand probabilistic classification properly. There's no scikit-learn: tokenising, counting, probability estimates, classification and every evaluation metric are hand-written. The report frames it within Bayesian networks; the implementation is a Naive Bayes classifier, the simplest Bayesian network, where every word is assumed independent given the class.</p>

      <h3>Data</h3>
      <p>2,000 training emails and 800 test emails (400 spam, 400 ham), stored as raw text files that include sender, receiver, date and time headers alongside the body.</p>

      <h3>How it works</h3>
      <h4>Text processing (<code>Processor.py</code>)</h4>
      <ol>
        <li>Read each email and clean out unwanted characters and phrases.</li>
        <li>Tokenise into words and lowercase them.</li>
        <li>Count how often each word appears overall, in spam and in ham.</li>
        <li>Turn the counts into <strong>smoothed</strong> conditional probabilities, P(word | spam) and P(word | ham). Smoothing adds a small count to every word so a word never seen in one class doesn't zero out the whole probability.</li>
        <li>Save the vocabulary with its probabilities to <code>model.txt</code>. That file is the trained model.</li>
      </ol>
      <h4>Classification (<code>Model.py</code>)</h4>
      <ol>
        <li>Class priors come from the share of spam and ham in the training set.</li>
        <li>For a new email, combine the prior with the probability of each of its words under each class, and predict whichever class scores higher.</li>
        <li>Write every prediction to <code>result.txt</code>, then build the confusion matrix and compute accuracy, precision, recall and F1, all by hand.</li>
      </ol>

      <h3>Results</h3>
      <table>
        <thead><tr><th></th><th>Predicted spam</th><th>Predicted ham</th></tr></thead>
        <tbody>
          <tr><td>Actual spam</td><td>336</td><td>64</td></tr>
          <tr><td>Actual ham</td><td>6</td><td>394</td></tr>
        </tbody>
      </table>
      <table>
        <thead><tr><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1</th></tr></thead>
        <tbody><tr><td>91.25%</td><td>98.25%</td><td>84.00%</td><td>90.57%</td></tr></tbody>
      </table>

      <h3>Reading the numbers</h3>
      <p>The filter is cautious. It wrongly flagged only 6 of 400 genuine emails, but let 64 of 400 spam messages through. That's the right trade-off for email: a missed spam is an annoyance, while a real message lost to the spam folder can actually cost someone. Recall could be raised by moving the decision threshold, at the price of more false positives.</p>

      <h3>In the repo</h3>
      <p>The processor, model and runner code, the notebook, the saved vocabulary and results, the report and the slides.</p>`,
  },

  {
    id: 'diabetes-prediction',
    title: 'Diabetes Prediction with PySpark',
    kind: 'Course Project',
    date: 'Jan 2024',
    cover: 'images/covers/diabetes-prediction.jpg',
    domains: ['Machine Learning'],
    team: TRIO,
    guide: 'Dr. Manju Venugopalan',
    summary: 'Five classifiers compared on 100,000 patient records using PySpark MLlib. Random Forest won with 97.3% accuracy and perfect precision, though recall shows how much class imbalance flatters these numbers.',
    skills: ['Python', 'PySpark', 'Spark MLlib', 'Random Forest', 'Logistic Regression', 'SVM', 'Naive Bayes', 'Decision Trees', 'Pandas'],
    links: { github: GH3 + 'Diabetes_Prediction%20using%20Machine%20Learning' },
    details: `
      <h3>Overview</h3>
      <p>Diabetes often goes undiagnosed for years, and early detection changes outcomes. Routine health records already contain strong signals: age, BMI, blood glucose, HbA1c. This project builds diabetes classifiers on a large patient dataset using <strong>PySpark</strong>, so the same pipeline would scale to hospital-sized data spread across machines.</p>

      <h3>Data</h3>
      <p>A Kaggle dataset of <strong>100,000 patient records</strong> with nine columns: gender, age, hypertension, heart disease, smoking history, BMI, HbA1c level, blood glucose level, and the diabetes label.</p>

      <h3>Preparation</h3>
      <ul>
        <li>Categorical values were encoded numerically, and the free-text smoking history and gender columns were dropped from the final feature set.</li>
        <li>A correlation matrix was used to check how each feature relates to diabetes, and to each other, before choosing features.</li>
        <li>Features were assembled into a single vector with Spark's <code>VectorAssembler</code>, and the data was split 70/30 for training and testing. Other train/test ratios were also tried to check that the results held.</li>
      </ul>

      <h3>Models</h3>
      <p>Five classifiers from Spark MLlib: Logistic Regression, Naive Bayes, Decision Tree, Random Forest and Support Vector Machine. For logistic regression we also plotted the learned coefficients and the ROC curve to see which features drive its predictions.</p>

      <h3>Results</h3>
      <table>
        <thead><tr><th>Model</th><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1</th></tr></thead>
        <tbody>
          <tr><td><strong>Random Forest</strong></td><td><strong>97.28%</strong></td><td>100%</td><td>68.44%</td><td><strong>81.26%</strong></td></tr>
          <tr><td>Decision Tree</td><td>97.05%</td><td>100%</td><td>65.49%</td><td>79.15%</td></tr>
          <tr><td>Logistic Regression</td><td>95.18%</td><td>85.63%</td><td>61.82%</td><td>71.88%</td></tr>
          <tr><td>SVM</td><td>94.52%</td><td>99.67%</td><td>36.02%</td><td>52.92%</td></tr>
          <tr><td>Naive Bayes</td><td>90.21%</td><td>38.65%</td><td>24.91%</td><td>30.29%</td></tr>
        </tbody>
      </table>

      <h3>Reading the numbers honestly</h3>
      <p>Most patients in the dataset don't have diabetes, so accuracy is flattering: a model that always predicted "no diabetes" would still score above 90%. The more useful columns are recall and F1.</p>
      <ul>
        <li>The tree models never raised a false alarm (100% precision), but still missed about a third of diabetic patients.</li>
        <li>SVM looks fine on accuracy but caught only 36% of diabetic patients.</li>
        <li>For a screening tool, the next step would be rebalancing the classes (resampling or class weights) and tuning the decision threshold to trade some precision for recall.</li>
      </ul>

      <h3>In the repo</h3>
      <p>The dataset, a notebook per model, PySpark scripts, the report and the slides.</p>`,
  },

  {
    id: 'face-login',
    title: 'Student Portal with Face Login',
    kind: 'Course Project',
    date: 'Dec 2023',
    cover: 'images/covers/face-login.jpg',
    domains: ['Full Stack', 'Computer Vision'],
    team: TRIO,
    course: 'Database Management Systems',
    summary: 'A Flask student portal where you can sign in with a password or with your face. Your webcam capture is matched against a stored face encoding using a stricter-than-default threshold.',
    skills: ['Python', 'Flask', 'face_recognition (dlib)', 'SQLite', 'SQL', 'HTML', 'CSS', 'JavaScript', 'Database Design'],
    links: { github: GH3 + 'Face%20Recognition%20Login%20Page' },
    details: `
      <h3>Overview</h3>
      <p>College portals almost always use a registration number and password. This project adds face recognition as a second way in, as a software-only feature: no special hardware, just the webcam every laptop already has.</p>

      <h3>How it works</h3>
      <h4>1. Register</h4>
      <p>A student creates an account with a username and password. The password is stored as a salted hash, never in plain text.</p>
      <h4>2. Set up Face ID</h4>
      <p>Once logged in, the student captures a photo from the webcam. The browser sends it to the server as base64. The server saves it and checks that a face can actually be found in it, rejecting the photo if not.</p>
      <h4>3. Log in with your face</h4>
      <ol>
        <li>On the face-login page, the student enters a username and the webcam captures a frame.</li>
        <li>The server uses the <code>face_recognition</code> library, built on dlib's deep face-recognition model (99.38% on the Labeled Faces in the Wild benchmark), to turn the stored photo and the new frame into 128-number face encodings.</li>
        <li>It measures the distance between the two encodings. Distance ≤ 0.5 is a match and logs the student in. That's deliberately stricter than the library's default of 0.6, trading some convenience for fewer false accepts.</li>
        <li>Clear errors cover an unknown username, no face in the frame, and a face that doesn't match.</li>
      </ol>

      <h3>Database design</h3>
      <p>This was a DBMS course project, so the data model was a deliverable. The schema has three entities:</p>
      <ul>
        <li><strong>Student:</strong> student ID (primary key), name, email</li>
        <li><strong>User account:</strong> username, password hash</li>
        <li><strong>Face data:</strong> face ID (primary key), face template</li>
      </ul>
      <p>It's implemented in SQLite, a serverless, embedded database that suits a single-server app.</p>

      <h3>Security, honestly</h3>
      <p>The report is upfront about the weak point: single-image face matching can be fooled by holding up a photo of the person. It proposes liveness checks, such as verifying across several video frames or asking the user to perform a gesture. The submitted version does single-frame matching. Liveness detection, and storing encodings rather than raw photos, would be the next steps before trusting this for anything sensitive.</p>

      <h3>In the repo</h3>
      <p>The Flask application, templates (login, register, camera, face setup), styles, the database, the report and the slides.</p>`,
  },

  {
    id: 'c-to-python',
    title: 'C to Python Translator',
    kind: 'Course Project',
    date: 'May 2024',
    cover: 'images/covers/c-to-python.jpg',
    domains: ['Systems & Programming'],
    team: TRIO,
    guide: 'Meena Belwal',
    summary: 'A source-to-source compiler that reads C and writes equivalent, runnable Python. Built with Lex for tokenizing, Yacc for parsing, and a code generator that handles Python\'s indentation.',
    skills: ['C++', 'Lex / Flex', 'Yacc / Bison', 'Compiler Design', 'Abstract Syntax Trees', 'Python'],
    links: { github: GH3 + 'C%20to%20Python%20Compiler' },
    details: `
      <h3>Overview</h3>
      <p>Translating code between languages means more than swapping keywords. C and Python differ in typing, block structure, standard library and syntax. This project builds a translator that takes a C program and produces Python that runs and behaves the same, using the classic compiler toolchain: Lex and Yacc.</p>

      <h3>The pipeline</h3>
      <h4>1. Lexical analysis (Lex)</h4>
      <p>Regular expressions split the C source into tokens. Each pattern maps to a token type:</p>
      <table>
        <thead><tr><th>Source</th><th>Token</th></tr></thead>
        <tbody>
          <tr><td><code>if</code>, <code>else</code>, <code>for</code>, <code>while</code>, <code>return</code></td><td>TIF, TELSE, TFOR, TWHILE, TRETURN</td></tr>
          <tr><td><code>int</code>, <code>double</code>, <code>char</code>, <code>void</code></td><td>TINTTYPE, TDOUBLETYPE, TCHARTYPE, TVOIDTYPE</td></tr>
          <tr><td>identifiers, integers, decimals, chars, strings</td><td>TIDENTIFIER, TINTEGER, TDOUBLE, TCHAR, TSTRING</td></tr>
          <tr><td><code>== != &lt; &lt;= &gt; &gt;= &amp;&amp; ||</code></td><td>TCEQ, TCNE, TCLT, TCLE, TCGT, TCGE, TAND, TOR</td></tr>
          <tr><td>brackets, punctuation, arithmetic</td><td>TLPAREN … TSEMICOLON, TPLUS, TMINUS, TMUL, TDIV</td></tr>
        </tbody>
      </table>
      <p>The lexer also counts line numbers, so errors can point to the right place.</p>
      <h4>2. Syntax analysis (Yacc)</h4>
      <p>Grammar rules turn the token stream into an <strong>abstract syntax tree</strong>: declarations, expressions with the right precedence and associativity, conditionals, loops and function definitions.</p>
      <h4>3. Semantic analysis</h4>
      <p>Checks declarations, function definitions and type compatibility, reporting errors such as undefined variables before any Python is written.</p>
      <h4>4. Code generation</h4>
      <p>Walks the tree and emits Python:</p>
      <ul>
        <li>C's braces become Python indentation.</li>
        <li><code>&amp;&amp;</code>, <code>||</code> and <code>!</code> become <code>and</code>, <code>or</code> and <code>not</code>.</li>
        <li>Typed declarations become plain assignments, since Python is dynamically typed.</li>
        <li>One-dimensional arrays become lists.</li>
        <li><code>printf</code>, <code>scanf</code>, <code>atoi</code> and <code>strlen</code> map to helper functions in a small Python <code>utils</code> module.</li>
      </ul>

      <h3>Scope</h3>
      <p><strong>Supported:</strong> variables and literals, arithmetic and logical expressions, <code>if</code>/<code>else</code>, <code>for</code> and <code>while</code> loops, one-dimensional arrays, and functions (including <code>void</code>).<br>
      <strong>Not supported:</strong> pointers, <code>break</code>/<code>continue</code>, <code>do-while</code>, and bare conditions like <code>if (a)</code>, which must be written <code>if (a != 0)</code>.</p>

      <h3>Testing</h3>
      <p>We translated and ran three programs end to end: a palindrome checker (string input, length and character comparison), a Fibonacci generator (loops and conditionals) and a program with <code>plus</code>, <code>minus</code> and <code>sayHello</code> functions (int and void functions with user input). Each generated Python file ran without errors and matched the C output.</p>
      <pre><code>// C                         # generated Python
int a = 5;                   a = 5
int b = 10;                  b = 10
int sum = a + b;             sum = a + b
printf("Sum: %d\\n", sum);    print("Sum:", sum)</code></pre>

      <h3>Credits</h3>
      <p>The translator code builds on an open-source Lex/Yacc C-to-Python translator by Jialong Wu, Yishujie Zhao and Shuwei Huang, credited in <code>Code/README.md</code>. Our work covered the design write-up, the token and grammar analysis, testing on our own programs, and the paper and presentation.</p>`,
  },

  {
    id: 'leishmania-detection',
    title: 'Leishmaniasis Detection',
    kind: 'Course Project',
    date: 'Jun 2023',
    cover: 'images/covers/leishmania-detection.jpg',
    domains: ['Bioinformatics', 'Machine Learning'],
    team: TRIO,
    guide: 'Dr. Siva Kumar',
    summary: 'Two ways of flagging leishmaniasis: sequence alignment of DNA against a Leishmania reference, and KNN/SVM classifiers on clinical symptoms. The SVM caught 12 of 14 positive cases.',
    skills: ['Python', 'Biopython', 'Sequence Alignment', 'Scikit-learn', 'SVM', 'KNN', 'Bioinformatics'],
    links: { github: GH2 + 'Lesishmania%20Disease%20Detection%20using%20%20Machine%20Learning' },
    details: `
      <h3>Overview</h3>
      <p>Leishmaniasis is a parasitic disease spread by sandfly bites, common in parts of South Asia, Africa and Latin America. Lab diagnosis (microscopy, PCR, LAMP) needs equipment and trained staff that rural clinics often lack. This project explores two cheaper computational routes: analysing DNA sequences directly, and predicting the disease from clinical symptoms with machine learning.</p>

      <h3>Part 1: Sequence analysis</h3>
      <ul>
        <li>A Leishmania reference sequence of about 2,400 nucleotides (FASTA) is compared with test sequences, including a human DNA sample of about 2,500 nucleotides.</li>
        <li>Each input is aligned against the reference with Biopython's global pairwise alignment, to see how much of the parasite's sequence appears in it.</li>
        <li>The sequence is also read in short fragments, with GC content (the share of G and C bases) computed for each. GC content is a simple fingerprint that differs between organisms. The fragments ranged from about 49% to 54%.</li>
      </ul>

      <h3>Part 2: Prediction from symptoms</h3>
      <h4>Data</h4>
      <p>299 patient records with 12 clinical features (including age, fever, weight loss, liver swelling, fatigue, abnormal blood tests, platelet count, serum creatinine and sodium) and a leishmaniasis label.</p>
      <h4>Method</h4>
      <ul>
        <li>An 80/20 train/test split, with features standardised so large-valued measurements like platelet count don't dominate distance calculations.</li>
        <li><strong>K-Nearest Neighbours</strong> (Euclidean distance, k = 5), with a sweep over k = 1–10 to see how the choice of k affects results.</li>
        <li><strong>Support Vector Machine</strong> with a linear kernel, also tested across test-set sizes from 10% to 90%.</li>
      </ul>
      <h4>Results</h4>
      <p>On the 60-patient test set (14 positive):</p>
      <table>
        <thead><tr><th>Model</th><th>Accuracy</th><th>Positives caught</th><th>False alarms</th><th>Macro F1</th></tr></thead>
        <tbody>
          <tr><td><strong>SVM</strong></td><td>86.7%</td><td><strong>12 / 14</strong></td><td>6</td><td><strong>0.83</strong></td></tr>
          <tr><td>KNN</td><td>85.0%</td><td>7 / 14</td><td>2</td><td>0.76</td></tr>
        </tbody>
      </table>
      <p>The accuracies are almost identical, but they describe very different tools. KNN missed half the sick patients. The SVM caught 86% of them, at the cost of a few more false alarms. For a screening test, where a missed case is far worse than a follow-up test, the SVM is clearly the better choice.</p>

      <h3>Limitations</h3>
      <p>299 records is small, and the 14 positive test cases make every percentage noisy. One more correct or missed case moves recall by 7 points. These are proof-of-concept results.</p>
      <h3>In the repo</h3>
      <p>The notebook, the FASTA and symptom datasets, the report and the slides.</p>`,
  },

  {
    id: 'maze-robot',
    title: 'Maze-Solving Robot',
    kind: 'Course Project',
    date: 'Jun 2023',
    cover: 'images/covers/maze-robot.jpg',
    domains: ['Robotics & IoT'],
    team: TRIO,
    guide: 'Mr. Rajesh',
    course: 'Robot Operating Systems',
    summary: 'A simulated robot that navigates mazes on its own, built with ROS 2 nodes for spawning, control and state estimation, and tested on two maze layouts in Gazebo.',
    skills: ['ROS 2', 'Gazebo', 'Python', 'Path Planning', 'LiDAR', 'Odometry', 'Sensor Fusion'],
    links: { github: GH2 + 'Maze_Solving_Robot' },
    details: `
      <h3>Overview</h3>
      <p>Getting a robot through a maze needs the same building blocks as a warehouse robot or a search-and-rescue platform: perceive the surroundings, know where you are, plan a route and move along it safely. This project builds those blocks with ROS 2, and tests them in Gazebo's physics simulation before any hardware is involved.</p>

      <h3>Challenges addressed</h3>
      <ul>
        <li><strong>Maze representation:</strong> modelling walls, corridors and dead ends so they can be loaded into simulation.</li>
        <li><strong>Perception and localisation:</strong> knowing where the robot is despite sensor noise.</li>
        <li><strong>Path planning:</strong> choosing a route to the goal.</li>
        <li><strong>Control:</strong> turning that route into wheel commands without hitting walls.</li>
      </ul>

      <h3>Models</h3>
      <ul>
        <li>A <strong>robot model</strong> describing the robot's body, wheels and sensors for ROS 2, including a laser scanner (the blue fan of rays in the cover image).</li>
        <li><strong>Two maze models</strong> with different layouts, to check the approach isn't tuned to a single maze.</li>
      </ul>

      <h3>The three ROS 2 nodes</h3>
      <ol>
        <li><strong>Spawn node:</strong> loads the maze (walls, paths and the goal) into Gazebo through the ROS 2 interface, and places the robot.</li>
        <li><strong>Controller node:</strong> reads sensor data, plans a route using shortest-path methods such as Dijkstra's algorithm or A*, and converts it into motor commands, with collision avoidance from the laser scan.</li>
        <li><strong>Estimator node:</strong> tracks the robot's position and heading by fusing wheel odometry with inertial readings (the report covers Kalman and particle filters for this), so the controller always knows where the robot is.</li>
      </ol>
      <p>The nodes communicate over ROS 2 topics: the estimator publishes the robot's state, and the controller consumes it alongside the raw sensor data.</p>

      <h3>Results</h3>
      <p>The robot navigated both maze layouts autonomously in simulation. Recordings of both runs are in the repo's <code>Results/</code> folder (the cover image is a frame from the second maze).</p>

      <h3>In the repo</h3>
      <p>The report (with the block diagram and node flow chart), the slides and the two simulation videos.</p>`,
  },

  {
    id: 'fourier-encryption',
    title: 'Encryption with Fourier Matrices',
    kind: 'Course Project',
    date: 'Jun 2023',
    cover: 'images/covers/fourier-encryption.jpg',
    domains: ['Signal Processing'],
    summary: 'Encrypts text and images by moving them into the frequency domain with the Fourier transform and scrambling every frequency with a random key. Includes a frequency-analysis demo on a noisy signal.',
    skills: ['MATLAB', 'FFT', '2-D FFT', 'Linear Algebra', 'Signal Processing', 'Image Processing'],
    links: { github: GH2 + 'Encryption%20and%20Decryption%20using%20Fourier%20Matrices' },
    details: `
      <h3>Overview</h3>
      <p>The Discrete Fourier Transform is multiplication by the Fourier matrix, which is invertible. That makes it a natural base for a reversible scramble: transform the data, distort it with a secret key, and only someone with the key can undo the distortion and transform back. This project implements that idea in MATLAB for text and images, as three live scripts.</p>

      <h3>1. Text</h3>
      <ol>
        <li>Convert the message to ASCII codes ("Hello, World!" becomes 13 numbers).</li>
        <li>Apply the FFT to get 13 complex frequency coefficients.</li>
        <li>Generate a key of the same length from a normal distribution, and multiply each coefficient by its key value. The result is the ciphertext.</li>
        <li>To decrypt, divide by the same key, apply the inverse FFT, take the real part and round back to characters.</li>
      </ol>

      <h3>2. Images</h3>
      <p>The same idea in two dimensions:</p>
      <ol>
        <li>Read an image and convert it to greyscale.</li>
        <li>Apply the 2-D FFT across rows and columns.</li>
        <li>Multiply every frequency coefficient by a random key matrix the size of the image (uniform values).</li>
        <li>Decrypt by dividing by the key, applying the inverse 2-D FFT and converting back to 8-bit pixels. The result matches the original image.</li>
      </ol>

      <h3>3. Frequency analysis</h3>
      <p>A companion script shows what the transform actually reveals:</p>
      <ul>
        <li>Generate a 20 Hz sine wave and add random noise.</li>
        <li>Take the FFT and plot the magnitude spectrum. The 20 Hz component stands out clearly even though the noise hides it in the time domain.</li>
        <li>List the five dominant frequencies, then filter in the frequency domain and inverse-transform to recover a cleaner signal.</li>
      </ul>

      <h3>Worth knowing</h3>
      <p>This demonstrates the maths, not real cryptography. The key is as long as the message, the scheme is linear, and an attacker with a few known plaintext–ciphertext pairs could recover the key. The point was to show how an invertible transform plus a key gives a reversible scramble, and to build intuition for frequency-domain thinking.</p>

      <h3>In the repo</h3>
      <p>The text, image and frequency-analysis live scripts, and a standalone script version of the text encryption.</p>`,
  },

  {
    id: 'letter-recognition',
    title: 'Letter Recognition',
    kind: 'Course Project',
    date: 'Jan 2023',
    cover: 'images/covers/letter-recognition.jpg',
    domains: ['Machine Learning'],
    team: TRIO,
    course: 'Python for Machine Learning',
    summary: 'Identifies which of the 26 capital letters a sample is from 16 shape measurements. KNN reached 94.2% accuracy on 4,000 test letters, ten points ahead of a linear SVM.',
    skills: ['Python', 'Scikit-learn', 'KNN', 'SVM', 'Decision Trees', 'Pandas', 'Matplotlib', 'Seaborn'],
    links: { github: GH2 + 'Letter%20Recognition%20using%20Machine%20Learning' },
    details: `
      <h3>Overview</h3>
      <p>Reading handwritten or printed characters underlies postal sorting, cheque processing and document digitisation. This project tackles a simplified version: given numeric measurements of a letter's shape, predict which letter it is. It's a classic, clean benchmark for comparing classifiers on a 26-class problem.</p>

      <h3>Data</h3>
      <p>The <strong>Letter Recognition</strong> dataset: 20,000 samples of the capital letters A to Z, generated from 20 different fonts with random distortions. Each sample has 16 integer features measured from the letter's image, including:</p>
      <ul>
        <li>position and size of the bounding box (x, y, width, height)</li>
        <li>total number of "on" pixels</li>
        <li>mean position of those pixels, and their variances and correlations (x², y², xy, x²y, xy²)</li>
        <li>edge counts scanning left-to-right and bottom-to-top, and how they correlate with position</li>
      </ul>

      <h3>Method</h3>
      <ul>
        <li>An 80/20 split (16,000 training, 4,000 test letters), with features standardised.</li>
        <li><strong>K-Nearest Neighbours:</strong> k = 5 with Euclidean distance, plus a sweep over k = 1–10 tracking accuracy, precision, recall and F1.</li>
        <li><strong>Support Vector Machine:</strong> a linear kernel, with the report comparing linear, polynomial and RBF kernels, and a sweep across test-set sizes from 10% to 90%.</li>
        <li><strong>Decision Tree:</strong> entropy-based splits, with the same test-size sweep.</li>
        <li>Every model was evaluated with a per-letter classification report and a 26×26 confusion matrix.</li>
      </ul>

      <h3>Results</h3>
      <table>
        <thead><tr><th>Model</th><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1</th></tr></thead>
        <tbody>
          <tr><td><strong>KNN (k = 5)</strong></td><td><strong>94.2%</strong></td><td>94.2%</td><td>94.2%</td><td>94.2%</td></tr>
          <tr><td>Linear SVM</td><td>84.5%</td><td>84.7%</td><td>84.5%</td><td>84.5%</td></tr>
        </tbody>
      </table>
      <p>KNN's advantage makes sense here. Letters form many small, irregular clusters in feature space, which a linear boundary can't separate cleanly but nearest-neighbour voting handles well. A non-linear (RBF) SVM would likely close most of the gap.</p>
      <p>The decision tree's recorded score (71.8%) comes from a run where the test-size sweep had left it training on only 10% of the data, so it isn't a like-for-like comparison with the two models above.</p>

      <h3>In the repo</h3>
      <p>The notebook, the dataset, the report and the slides.</p>`,
  },

  {
    id: 'welding-robot',
    title: 'Welding Robot Simulation',
    kind: 'Course Project',
    date: 'Jan 2023',
    cover: 'images/covers/welding-robot.jpg',
    domains: ['Robotics & IoT'],
    team: TRIO,
    guide: 'Nidhin Prabhakar T V',
    course: 'Introduction to Robotics',
    summary: 'A simulated 6-axis robot arm that welds a chosen shape (3D lines, square, rectangle or triangle), using inverse kinematics to work out every joint angle along the seam.',
    skills: ['MATLAB', 'Robotics Toolbox', 'Inverse Kinematics', 'DH Parameters', 'Trajectory Planning'],
    links: { github: GH2 + 'Welding%20Robot%20Using%20Matlab' },
    details: `
      <h3>Overview</h3>
      <p>The brief: design a welding robot with a suitable number of degrees of freedom, where the input is a welding area (a line or a basic shape) and the robot must trace it. We modelled a 6-axis industrial-style arm in MATLAB, enough freedom to reach any point in its workspace with the torch at any orientation, and made it weld a choice of shapes.</p>

      <h3>The arm</h3>
      <p>Six revolute joints, each described by its <strong>Denavit–Hartenberg parameters</strong>, the standard way of specifying how each link sits relative to the previous one:</p>
      <table>
        <thead><tr><th>Link</th><th>d (offset)</th><th>a (length)</th><th>α (twist)</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>0</td><td>0</td><td>−90°</td></tr>
          <tr><td>2</td><td>0</td><td>1000</td><td>0°</td></tr>
          <tr><td>3</td><td>0</td><td>0</td><td>90°</td></tr>
          <tr><td>4</td><td>1330</td><td>0</td><td>−90°</td></tr>
          <tr><td>5</td><td>0</td><td>0</td><td>90°</td></tr>
          <tr><td>6</td><td>470</td><td>0</td><td>0°</td></tr>
        </tbody>
      </table>
      <p>The links are assembled into a <code>SerialLink</code> robot with Peter Corke's Robotics Toolbox for MATLAB.</p>

      <h3>How a weld is planned</h3>
      <ol>
        <li>A menu asks which shape to weld: three connected lines in three different planes, a square, a rectangle or a triangle.</li>
        <li>Each corner of the shape is defined as a full pose: a position (<code>transl</code>) plus a torch orientation from roll–pitch–yaw angles (<code>rpy2tr</code>).</li>
        <li>Between consecutive corners, <code>ctraj</code> generates a smooth Cartesian path of intermediate poses.</li>
        <li><strong>Inverse kinematics</strong> (<code>ikine</code>) solves for the six joint angles that put the torch at each pose, which is the hard direction compared with forward kinematics.</li>
        <li>The joint-angle sequences for every edge are joined and played back, animating the arm tracing the seam, with the target shape drawn in 3D for comparison.</li>
      </ol>

      <h3>Results</h3>
      <p>The arm traced all four shapes. Recorded simulation runs are in the repo's <code>Results/</code> folder; the cover image is a frame from one of them.</p>

      <h3>In the repo</h3>
      <p>The MATLAB live script, four simulation recordings, the report and the slides.</p>`,
  },

  {
    id: 'mers-sars',
    title: 'MERS vs SARS Genome Analysis',
    kind: 'Course Project',
    date: 'Jan 2023',
    cover: 'images/covers/mers-sars.jpg',
    domains: ['Bioinformatics'],
    team: TRIO,
    course: 'Intelligence in Biological Systems',
    summary: 'Compares the full genomes of SARS, SARS-CoV-2 and MERS, and analyses the proteins they encode. SARS and SARS-CoV-2 align at 83%; MERS at about 70% with each.',
    skills: ['Python', 'Biopython', 'Sequence Alignment', 'Protein Analysis', 'Matplotlib'],
    links: { github: GH2 + 'Similarity%20Analysis%20of%20Mers%20and%20Sars' },
    details: `
      <h3>Overview</h3>
      <p>SARS (2003), MERS (2012) and SARS-CoV-2 (2019) are all coronaviruses that jumped from animals to people, with different severity and spread. Comparing their genomes shows how closely related they are. This project does that comparison and analyses the proteins one of the genomes encodes, using Biopython.</p>

      <h3>Data</h3>
      <p>Three reference genomes in FASTA format:</p>
      <table>
        <thead><tr><th>Virus</th><th>Genome length</th></tr></thead>
        <tbody>
          <tr><td>SARS-CoV</td><td>29,751 nucleotides</td></tr>
          <tr><td>SARS-CoV-2 (GenBank MN908947)</td><td>29,903 nucleotides</td></tr>
          <tr><td>MERS-CoV</td><td>30,119 nucleotides</td></tr>
        </tbody>
      </table>

      <h3>Part 1: From genome to proteins</h3>
      <ol>
        <li>Transcribe the DNA sequence to mRNA.</li>
        <li>Translate the mRNA to amino acids with the standard codon table.</li>
        <li>Split the result at stop codons and keep only stretches of at least 20 amino acids, the plausible protein fragments.</li>
        <li>Analyse each fragment with Biopython's ProtParam module: amino-acid counts and percentages, molecular weight, aromaticity, flexibility, isoelectric point (the pH at which the protein carries no net charge) and secondary-structure fractions.</li>
        <li>Plot the amino-acid composition of a protein of interest.</li>
      </ol>

      <h3>Part 2: Comparing the genomes</h3>
      <p>Each pair of genomes was globally aligned with Biopython's <code>pairwise2</code>, and the alignment score taken as a share of genome length:</p>
      <table>
        <thead><tr><th>Pair</th><th>Similarity</th></tr></thead>
        <tbody>
          <tr><td>SARS ↔ SARS-CoV-2</td><td><strong>83.3%</strong></td></tr>
          <tr><td>MERS ↔ SARS</td><td>69.9%</td></tr>
          <tr><td>MERS ↔ SARS-CoV-2</td><td>69.4%</td></tr>
        </tbody>
      </table>
      <p>The ordering matches the biology: SARS and SARS-CoV-2 belong to the same viral lineage, while MERS sits on a more distant branch, roughly equally far from both.</p>

      <h3>A caveat on the method</h3>
      <p>The alignment scores matches and doesn't penalise gaps, so it rewards inserting gaps to line up any matching bases. That inflates the absolute percentages, since even unrelated sequences would score well above zero. The <em>relative</em> ordering is meaningful; the exact numbers would come down with a proper scoring scheme with gap penalties.</p>

      <h3>In the repo</h3>
      <p>The notebook, the three genome files, the report and the slides.</p>`,
  },

  {
    id: 'home-automation',
    title: 'Home Automation on a Mesh Network',
    kind: 'Course Project',
    date: 'Jan 2023',
    cover: 'images/covers/home-automation.jpg',
    domains: ['Robotics & IoT', 'Systems & Programming'],
    team: TRIO,
    course: 'Data Structures & Algorithms 2',
    summary: 'Models a smart home as a mesh network: ten devices stored as a graph, where switching one device spreads to everything connected to it through a breadth-first search.',
    skills: ['Java', 'Graphs', 'Breadth-First Search', 'Hash Maps', 'Data Structures'],
    links: { github: GH2 + 'HOME%20AUTOMATION%20WITH%20MESH%20TOPOLOGY' },
    details: `
      <h3>Overview</h3>
      <p>In a mesh network every device can relay messages for the others, so there are several routes between any two devices, and the home keeps working when one of them drops out. This project models a mesh-connected smart home as a <strong>graph</strong>, and implements device control with standard graph algorithms.</p>

      <h3>The home</h3>
      <p>Ten devices across three rooms, each a node in the graph:</p>
      <ul>
        <li><strong>Hall:</strong> sensor, bar light, TV</li>
        <li><strong>Kitchen:</strong> sensor, bulb, exhaust fan</li>
        <li><strong>Bedroom:</strong> sensor, light, TV, AC</li>
      </ul>
      <p>Eighteen connections link them into a mesh. Sensors connect to devices in their own room and to each other, and there are cross-links (for example kitchen bulb to bedroom TV) so there's no single point of failure. The cover image is this graph as drawn in the report.</p>

      <h3>Data structures</h3>
      <ul>
        <li><strong>Adjacency list</strong> (<code>HashMap&lt;String, LinkedList&lt;String&gt;&gt;</code>) for the connections, which is efficient for a sparse graph where each device links to only a few others.</li>
        <li><strong>Hash maps</strong> holding each device's on/off state, for constant-time lookups and updates.</li>
      </ul>

      <h3>Operations</h3>
      <ul>
        <li><strong>Add device / add connection:</strong> build the graph, with edges added in both directions since connections are two-way.</li>
        <li><strong>Set state:</strong> switch a single device on or off.</li>
        <li><strong>Group on / group off:</strong> breadth-first search from a starting device using a queue. Every reachable device that isn't already in the target state is switched and its neighbours queued. Checking the state first stops the search going round in circles in a graph full of cycles.</li>
        <li><strong>Propagate state:</strong> a recursive version that pushes a device's state outward to its mesh neighbours.</li>
        <li><strong>Status report:</strong> prints every device and whether it's on or off.</li>
      </ul>

      <h3>Why BFS</h3>
      <p>Breadth-first search switches devices in order of how many hops they are from the starting device. On a real mesh, that's the order a broadcast would reach them, so the simulation's behaviour matches how the physical network would respond.</p>

      <h3>In the repo</h3>
      <p>The Java source, the report and the slides.</p>`,
  },

  {
    id: 'phone-book',
    title: 'Phone Book in Java',
    kind: 'Course Project',
    date: 'Jul 2022',
    cover: 'images/covers/phone-book.jpg',
    domains: ['Systems & Programming'],
    team: TRIO,
    summary: 'A console contact manager built on a hand-written singly linked list that keeps contacts sorted by surname as they\'re inserted. Search by name or email, and save to and restore from disk.',
    skills: ['Java', 'Linked Lists', 'Data Structures', 'File I/O'],
    links: { github: GH1 + 'Phone%20Book%20Application' },
    details: `
      <h3>Overview</h3>
      <p>A first-year data structures project: a working phone directory where the storage is a linked list we wrote ourselves, rather than Java's built-in collections. The point was to understand what a list actually does underneath.</p>

      <h3>The data structure</h3>
      <ul>
        <li><code>SLNode</code>: one contact, holding name, email, phone number and a reference to the next node.</li>
        <li><code>SLList</code>: the singly linked list, tracking the head and the length.</li>
      </ul>
      <h4>Sorted insertion</h4>
      <p>The directory must stay sorted by surname without ever running a sorting algorithm. So <code>add</code> walks the list comparing the new contact's last name (case-insensitive) with each existing one, and splices the new node in at the right point. Sorting comes for free with every insertion, and the list is always ready to print in order.</p>

      <h3>Features</h3>
      <p>A single-letter console menu:</p>
      <table>
        <thead><tr><th>Key</th><th>Action</th></tr></thead>
        <tbody>
          <tr><td>A</td><td>Add a contact (inserted in sorted position)</td></tr>
          <tr><td>S</td><td>Search by name</td></tr>
          <tr><td>E</td><td>Search by email</td></tr>
          <tr><td>D</td><td>Delete a contact by its index number</td></tr>
          <tr><td>P</td><td>Print the whole directory</td></tr>
          <tr><td>W</td><td>Write the directory to disk</td></tr>
          <tr><td>R</td><td>Restore it from disk</td></tr>
          <tr><td>Q</td><td>Quit</td></tr>
        </tbody>
      </table>
      <p>An <code>InputOutput</code> class handles reading from and writing to files, keeping persistence separate from the list logic.</p>

      <h3>Trade-offs we learned</h3>
      <p>A singly linked list makes insertion cheap once you've found the spot, but every search is a walk from the head, and you can't step backwards. A doubly linked list, or a balanced tree for faster lookups, would be the next step for a large directory.</p>

      <h3>In the repo</h3>
      <p>The Java source (<code>PhoneBook</code>, <code>SLList</code>, <code>SLNode</code>, <code>InputOutput</code>), the report and the slides.</p>`,
  },

  {
    id: 'stacker-game',
    title: 'Stacker Game in Jack',
    kind: 'Course Project',
    date: 'Jul 2022',
    cover: 'images/covers/stacker-game.jpg',
    domains: ['Systems & Programming'],
    team: TRIO,
    course: 'Elements of Computing Systems 2',
    summary: 'The arcade stacking game, written in Jack (the Nand2Tetris language) for a computer built up from logic gates. 15 levels on a 7-column grid, getting faster as you climb.',
    skills: ['Jack', 'Nand2Tetris', 'Object-Oriented Design', 'Game Loops', 'Memory Management'],
    links: { github: GH1 + 'Stacker%20Game%20Application' },
    details: `
      <h3>Overview</h3>
      <p>In the Nand2Tetris course you build a computer from NAND gates up to an operating system, then write software for it in Jack, a small object-based language that compiles down to the machine you built. Our final project was a full arcade game running on that stack.</p>

      <h3>How to play</h3>
      <ul>
        <li>Press <kbd>P</kbd> to play or <kbd>Q</kbd> to quit from the start menu.</li>
        <li>A row of blocks slides back and forth across a 7-column grid. Press <kbd>Space</kbd> to lock it on top of the stack.</li>
        <li>Blocks that overhang the row below fall away, so your row gets narrower with every misjudged drop.</li>
        <li>Lose every block and the game ends ("You lost the Game. Please Try Again"). Stack all <strong>15 levels</strong> and you win.</li>
      </ul>

      <h3>Difficulty</h3>
      <p>Speed is controlled by a delay counter: the row only moves once the counter runs out.</p>
      <ul>
        <li>Level 1 starts with a delay of 200.</li>
        <li>Levels 2–9 each shave off 10.</li>
        <li>Level 10 resets to 95.</li>
        <li>Levels above 10 drop by 30 each, so the last few levels are genuinely fast.</li>
      </ul>

      <h3>Code structure</h3>
      <table>
        <thead><tr><th>Class</th><th>Responsibility</th></tr></thead>
        <tbody>
          <tr><td><code>Main</code></td><td>Entry point: creates the game, runs it, frees it</td></tr>
          <tr><td><code>Stacker</code></td><td>Start menu and key handling</td></tr>
          <tr><td><code>StackerGame</code></td><td>Game loop, levels, and win/lose states</td></tr>
          <tr><td><code>MovingRow</code></td><td>The sliding row: position, direction, width and speed</td></tr>
          <tr><td><code>Stack</code></td><td>Locked rows; works out which blocks survive each drop</td></tr>
          <tr><td><code>Drawer</code></td><td>Draws the grid and blocks on the 512×256 screen</td></tr>
          <tr><td><code>Constants</code></td><td>Columns, levels and key codes</td></tr>
        </tbody>
      </table>
      <p>Jack has no garbage collector, so every class has a <code>dispose</code> method that frees its memory explicitly. It was a useful lesson in what higher-level languages do for you.</p>

      <h3>In the repo</h3>
      <p>The Jack source, the report (with screenshots) and the slides.</p>`,
  },

  {
    id: 'dna-to-protein',
    title: 'DNA to Protein Converter',
    kind: 'Course Project',
    date: 'Jul 2022',
    cover: 'images/covers/dna-to-protein.jpg',
    domains: ['Bioinformatics'],
    team: TRIO,
    course: 'Intelligence in Biological Systems',
    summary: 'A Python program that walks through gene expression step by step: read a DNA sequence, transcribe it to RNA, then translate it codon by codon into a protein.',
    skills: ['Python', 'Bioinformatics', 'String Processing'],
    links: { github: GH1 + 'DNA2PROTIEN' },
    details: `
      <h3>Overview</h3>
      <p>The "central dogma" of molecular biology says genetic information flows from DNA to RNA to protein. This first-year project implements that flow in plain Python, to make each step concrete instead of a diagram in a textbook.</p>

      <h3>Background</h3>
      <ul>
        <li><strong>DNA</strong> is a double strand of four bases: A, T, G and C.</li>
        <li><strong>Transcription</strong> copies a stretch of DNA into messenger RNA, with uracil (U) taking the place of thymine (T).</li>
        <li><strong>Translation</strong> reads the mRNA three bases (one codon) at a time. Each codon maps to one of 20 amino acids or a stop signal, and the chain of amino acids is the protein.</li>
      </ul>

      <h3>How the program works</h3>
      <ol>
        <li><strong>Read</strong> a DNA sequence from a text file, removing line breaks so the sequence is continuous.</li>
        <li><strong>Transcribe:</strong> build the complementary RNA strand by pairing each base (G↔C, T→A, A→U), flagging any character that isn't a valid base.</li>
        <li><strong>Translate:</strong> take an RNA sequence, step through it three bases at a time, and look each codon up in a 64-entry codon table to build the amino-acid sequence.</li>
        <li>Print the RNA and the resulting protein.</li>
      </ol>

      <h3>Ideas we noted for later</h3>
      <ul>
        <li>Handle all three reading frames, since translation can start at any of the first three bases.</li>
        <li>Stop at stop codons, and find start codons (AUG) automatically.</li>
        <li>Stronger validation and error handling for malformed input.</li>
      </ul>

      <h3>In the repo</h3>
      <p>The Python script, the report and the slides.</p>`,
  },

  {
    id: 'visitor-counter',
    title: 'Bidirectional Visitor Counter',
    kind: 'Course Project',
    date: 'Jul 2022',
    cover: 'images/covers/visitor-counter.jpg',
    domains: ['Robotics & IoT'],
    team: TRIO,
    course: 'Principles of Measurements and Sensors',
    summary: 'An Arduino device that counts people entering and leaving a room using the order in which two motion sensors fire. Live count on an LCD, with different tones for entry and exit.',
    skills: ['Arduino', 'C++', 'PIR Sensors', 'LCD', 'Embedded Systems', 'State Machines'],
    links: { github: GH1 + 'Bidirectional%20Visitor%20Counter%20using%20Arduino' },
    details: `
      <h3>Overview</h3>
      <p>Knowing how many people are in a room is useful for occupancy limits, energy saving (lights and AC only when someone's there) and footfall counts. A single sensor can tell that someone passed, but not which way. Two sensors side by side can, from the order they fire in.</p>

      <h3>Hardware</h3>
      <table>
        <thead><tr><th>Component</th><th>Role</th></tr></thead>
        <tbody>
          <tr><td>Arduino</td><td>Reads the sensors and runs the counting logic</td></tr>
          <tr><td>2 × PIR motion sensors</td><td>Pins 8 and 9, mounted side by side across the doorway</td></tr>
          <tr><td>16×2 LCD</td><td>Shows status messages and the live count</td></tr>
          <tr><td>Potentiometer</td><td>Adjusts the LCD contrast</td></tr>
          <tr><td>Piezo buzzer</td><td>Pin 7, audio feedback</td></tr>
        </tbody>
      </table>
      <p>PIR (passive infrared) sensors detect the infrared radiation people give off. When someone moves across a sensor's field, its output goes high.</p>

      <h3>The counting logic</h3>
      <p>The sketch is a small state machine that remembers which sensor fired first:</p>
      <ul>
        <li><strong>Entry:</strong> sensor 1, then sensor 2. The LCD shows "Visit started", then "Visitor entered", the count goes up, and the buzzer plays G4 (392 Hz).</li>
        <li><strong>Exit:</strong> sensor 2, then sensor 1. The LCD shows "Exit started", then "Visitor exited", the count goes down, and the buzzer plays C4 (262 Hz).</li>
        <li><strong>Edge cases:</strong> an exit isn't counted when the room is already empty ("No more visitors to exit"). Each sensor must reset before it can trigger again, so one person lingering in front of a sensor isn't counted twice.</li>
      </ul>
      <p>Every event is also printed to the serial monitor for debugging.</p>

      <h3>Ideas for a next version</h3>
      <ul>
        <li>Log counts over time to see when a room is busiest.</li>
        <li>A reset button for the count.</li>
        <li>Send the count wirelessly (for example over Bluetooth) to a phone.</li>
      </ul>

      <h3>In the repo</h3>
      <p>The Arduino sketch, the circuit design, a photo of the hardware build, the report and the slides.</p>`,
  },
];
