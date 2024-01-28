import { execSync } from 'child_process';
function getRepoName() {
  try {
    // Get the remote URL of the origin repository
    const remoteUrl = execSync('git remote get-url origin').toString().trim();

    // Extract the repository name from the remote URL
    const repoName = remoteUrl.match(/\/([^\/]+?)(?:\.git)?$/)?.[1] || 'unknown';

    return repoName;
  } catch (error) {
    throw new Error("Unable to get repo name: ", error.message);
  }
}

function getAuthorEmail() {
  try {
    // Get the email of the author of the initial commit
    const authorEmail = execSync('git log --format=%ae --reverse | head -n 1').toString().trim();
    return authorEmail;
  } catch (error) {
    throw new Error('Error retrieving repository author:', error.message);
  }
}

function getAuthorName() {

  try {
    // Get the name and email of the author of the initial commit
    const authorName = execSync('git log --format="%an" --reverse | head -n 1').toString().trim();
    return authorName;
  } catch (error) {
    throw new Error('Error retrieving repository author:', error.message);
  }
}

function getRepoUrl() {
  try {
    // Get the HTTPS URL of the origin repository
    const repoUrl = execSync('git remote get-url origin').toString().trim();
    return repoUrl;
  } catch (error) {
    return new Error('Error retrieving repository URL:', error.message);
  }
}

async function getRepoDescription(owner: string, repo: string): Promise<string | null> {
  console.log(owner, repo);
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    const data: any = await response.json();

    if (response.ok) {
      return data.description || null;
    } else {
      console.error(`Failed to fetch repository details: ${data.message}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching repository details:', error.message);
    return null;
  }
}

async function updatePackage() {
  const file = Bun.file('package.json');

  const repoName = getRepoName();
  const repoAuthor = getAuthorName();
  const repoEmail = getAuthorEmail();

  const pkg = JSON.parse(await file.text());
  if (pkg.name !== repoName) {
    pkg.name = repoName;
    pkg.version = "1.0.0";
  }
  pkg.repository.url = getRepoUrl();
  pkg.author = {
    name: repoAuthor,
    email: repoEmail,
  };

  const repoDescription = await getRepoDescription(repoAuthor, repoName);
  console.log(repoDescription);

  await Bun.write(file, JSON.stringify(pkg, null, "  ") + "\n");
  console.log(pkg);
}

updatePackage();
