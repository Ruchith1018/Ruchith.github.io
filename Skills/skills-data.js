// skills-data.js — skills grouped for the Skills page.
//
// Each skill:
//   name   label on the card
//   img    logo in SkillIages/  (or)  icon  Font Awesome class
//   core   also shown in the "Core stack" strip at the top
//   note   one line on how the skill has been used (optional)
//   uses   where it's been used:
//            'p:<project-id>'   a project in ../Projects/projects-data.js
//            'x:<experience-id>' a role on ../Experience/experience.html
//            { label, href }     anything else
//          Skills with no uses show without a "used in" panel.

const EXPERIENCE = {
  'exp-sg-ds': 'SG Analytics · Data Scientist',
  'exp-sg-intern': 'SG Analytics · Data Science Intern',
  'exp-chegg': 'Chegg · Subject Matter Expert',
};

const SKILL_GROUPS = [
  {
    title: 'GenAI & LLMs',
    skills: [
      { name: 'AWS Bedrock (Claude)', img: 'SkillIages/aws.svg', core: true,
        note: 'LLM work at SG Analytics, including a RAG-based SWOT analysis system during the internship.',
        uses: ['x:exp-sg-ds', 'x:exp-sg-intern'] },
      { name: 'LangChain', icon: 'fas fa-link', core: true,
        note: 'Document loading, chunking, PGVector retrieval and the LLM calls in Meridian.',
        uses: ['p:meridian-swot'] },
      { name: 'RAG', icon: 'fas fa-search-plus', core: true,
        note: 'Ontology RAG with multi-hop reasoning for a banking client (48% fewer tokens, 40% faster retrieval than flat-vector search); retrieval over SEC 10-Ks with a web-search fallback.',
        uses: ['x:exp-sg-ds', 'x:exp-sg-intern', 'p:meridian-swot'] },
      { name: 'Prompt Engineering', icon: 'fas fa-terminal',
        note: 'Prompt caching that cut per-request latency 97% (2 s to 50 ms) in production; sufficiency-check and batched-answer prompts in Meridian.',
        uses: ['x:exp-sg-ds', 'p:meridian-swot'] },
      { name: 'Embeddings & Semantic Search', icon: 'fas fa-project-diagram',
        note: 'Vector retrieval on LanceDB for an Ontology RAG demo; NVIDIA embeddings with MMR retrieval in Meridian.',
        uses: ['x:exp-sg-ds', 'p:meridian-swot'] },
      { name: 'Hugging Face Transformers', img: 'SkillIages/huggingface.svg',
        note: 'Fine-tuned BERT models for readability regression and sarcasm classification.',
        uses: ['p:text-readability', 'p:sarcasm-detection'] },
      { name: 'Agentic AI', icon: 'fas fa-brain',
        note: 'Building an agentic financial model builder: SEC EDGAR filings to income statement, balance sheet and cash-flow statement, with forecasts, a revenue build and a DCF.',
        uses: ['x:exp-sg-ds'] },
      { name: 'Vector Databases (LanceDB)', icon: 'fas fa-layer-group',
        note: 'LanceDB for an Ontology RAG demo; PGVector for Meridian.',
        uses: ['x:exp-sg-ds', 'p:meridian-swot'] },
    ],
  },
  {
    title: 'Machine Learning & Deep Learning',
    skills: [
      { name: 'PyTorch', icon: 'fas fa-fire',
        uses: ['p:sarcasm-detection', 'p:text-readability'] },
      { name: 'TensorFlow / Keras', img: 'SkillIages/tensorflow.svg',
        uses: ['p:drone-detection', 'p:tomato-leaf-disease', 'p:space-invaders-rl'] },
      { name: 'Scikit-learn', img: 'SkillIages/scikitlearn.svg',
        uses: ['p:letter-recognition', 'p:leishmania-detection'] },
      { name: 'NLP', icon: 'fas fa-language',
        note: 'Multi-label news classification across 55 risk categories in production (92% accuracy, 91% F1); sarcasm, readability and spam models.',
        uses: ['x:exp-sg-ds', 'p:sarcasm-detection', 'p:text-readability', 'p:spam-filter'] },
      { name: 'Computer Vision', icon: 'fas fa-eye',
        uses: ['p:drone-detection', 'p:tomato-leaf-disease', 'p:face-login'] },
      { name: 'Anomaly Detection', icon: 'fas fa-user-secret',
        note: 'Fraud-ring detection across 40+ transaction-level and behavioural parameters.',
        uses: ['x:exp-sg-ds'] },
      { name: 'Reinforcement Learning', icon: 'fas fa-gamepad',
        note: 'DQN vs PPO with an extended action space, written up as a research manuscript.',
        uses: ['p:space-invaders-rl'] },
      { name: 'Bioinformatics', icon: 'fas fa-dna',
        uses: ['p:mers-sars', 'p:leishmania-detection', 'p:dna-to-protein'] },
    ],
  },
  {
    title: 'Backend, Cloud & MLOps',
    skills: [
      { name: 'FastAPI', img: 'SkillIages/fastapi.svg', core: true,
        note: 'Crawler and data APIs at SG Analytics; streaming (SSE) backend for Meridian.',
        uses: ['x:exp-sg-intern', 'p:meridian-swot', 'p:job-automation-tracker'] },
      { name: 'ETL & Data Pipelines', icon: 'fas fa-stream',
        note: 'Production ETL that extracts, deduplicates and loads news for daily client delivery; a 500+ URLs/minute crawler pipeline.',
        uses: ['x:exp-sg-ds', 'x:exp-sg-intern'] },
      { name: 'AWS S3', img: 'SkillIages/aws.svg',
        uses: ['x:exp-sg-intern'] },
      { name: 'AWS Lambda', img: 'SkillIages/aws-lambda.svg', uses: ['p:job-automation-tracker'] },
      { name: 'Docker', img: 'SkillIages/docker.svg', uses: ['p:job-automation-tracker'] },
      { name: 'Scrapy', icon: 'fas fa-spider',
        note: 'Web crawler extracting 500+ URLs per minute.',
        uses: ['x:exp-sg-intern'] },
      { name: 'Streamlit', img: 'SkillIages/streamlit.svg', uses: [] },
      { name: 'Git & GitHub', img: 'SkillIages/git.svg',
        uses: [{ label: 'All projects on GitHub', href: 'https://github.com/Ruchith1018' }] },
    ],
  },
  {
    title: 'Data & Databases',
    skills: [
      { name: 'Python', img: 'SkillIages/python.png', core: true,
        uses: ['x:exp-sg-ds', 'x:exp-sg-intern', 'x:exp-chegg', 'p:meridian-swot', 'p:space-invaders-rl',
          'p:sarcasm-detection', 'p:drone-detection', 'p:tomato-leaf-disease', 'p:spam-filter',
          'p:job-automation-tracker', 'p:diabetes-prediction', 'p:face-login', 'p:letter-recognition', 'p:leishmania-detection'] },
      { name: 'PostgreSQL', img: 'SkillIages/postgresql.svg', core: true,
        note: 'Vector store and report storage in Meridian; system of record with pgvector in the Job Automation Tracker.',
        uses: ['p:meridian-swot', 'p:job-automation-tracker'] },
      { name: 'PGVector / Supabase', img: 'SkillIages/supabase.svg',
        uses: ['p:meridian-swot'] },
      { name: 'PySpark', icon: 'fas fa-bolt',
        uses: ['p:diabetes-prediction'] },
      { name: 'Pandas', icon: 'fas fa-table',
        uses: ['p:diabetes-prediction', 'p:letter-recognition', 'p:leishmania-detection', 'p:text-readability'] },
      { name: 'SQL & Database Design', icon: 'fas fa-database',
        uses: ['p:face-login'] },
      { name: 'MySQL', img: 'SkillIages/mysql.svg', uses: [] },
      { name: 'MongoDB', img: 'SkillIages/mongodb.png', uses: [] },
    ],
  },
  {
    title: 'Languages & Fundamentals',
    skills: [
      { name: 'C++', img: 'SkillIages/cpp.png',
        uses: ['x:exp-chegg', 'p:c-to-python', 'p:visitor-counter'] },
      { name: 'Java', img: 'SkillIages/java.jpg',
        uses: ['p:home-automation', 'p:phone-book'] },
      { name: 'JavaScript', img: 'SkillIages/javascript.svg',
        uses: ['p:meridian-swot', 'p:face-login', { label: 'This website', href: '../index.html' }] },
      { name: 'HTML & CSS', icon: 'fab fa-html5',
        uses: ['p:face-login', { label: 'This website', href: '../index.html' }] },
      { name: 'Data Structures & Algorithms', icon: 'fas fa-sitemap',
        note: '400+ solutions as a Chegg expert; graph and linked-list projects.',
        uses: ['x:exp-chegg', 'p:home-automation', 'p:phone-book'] },
      { name: 'TypeScript', img: 'SkillIages/typescript.svg', uses: ['p:job-automation-tracker'] },
      { name: 'React', img: 'SkillIages/react.png', uses: ['p:job-automation-tracker'] },
      { name: 'Node.js / Express', img: 'SkillIages/node.png', uses: [] },
    ],
  },
  {
    title: 'Robotics & Embedded',
    skills: [
      { name: 'ROS 2 & Gazebo', icon: 'fas fa-robot',
        uses: ['p:maze-robot'] },
      { name: 'MATLAB', icon: 'fas fa-square-root-alt',
        note: 'Inverse kinematics for a 6-axis arm; Fourier-based encryption of text and images.',
        uses: ['p:welding-robot', 'p:fourier-encryption'] },
      { name: 'Arduino', icon: 'fas fa-microchip',
        uses: ['p:visitor-counter'] },
    ],
  },
];
