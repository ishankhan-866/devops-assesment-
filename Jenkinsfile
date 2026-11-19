// Jenkins pipeline: build -> push to Docker Hub -> deploy to EC2.
// Job setup: Pipeline script from SCM, branch */main, GitHub webhook trigger.
// Credentials needed in Jenkins:
//   dockerhub-creds : Username with password (Docker Hub user + access token)
//   ec2-ssh         : SSH Username with private key (user: root)
pipeline {
    agent any

    triggers { githubPush() }

    environment {
        DOCKERHUB_USER = 'YOUR_DOCKERHUB_USERNAME'   // change me
        EC2_HOST       = '3.26.230.226'              // change if the IP changes
    }

    stages {
        stage('Build images') {
            steps {
                sh 'docker build -t $DOCKERHUB_USER/devops-backend:latest ./backend'
                sh 'docker build -t $DOCKERHUB_USER/devops-frontend:latest -f frontend/Dockerfile .'
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
                    sh 'echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin'
                    sh 'docker push $DOCKERHUB_USER/devops-backend:latest'
                    sh 'docker push $DOCKERHUB_USER/devops-frontend:latest'
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh', keyFileVariable: 'KEY')]) {
                    sh '''
                      ssh -i "$KEY" -o StrictHostKeyChecking=accept-new root@$EC2_HOST \
                        "cd ~/devops-assesment- && git pull origin main && docker compose up -d --build"
                    '''
                }
            }
        }
    }

    post {
        always { sh 'docker logout || true' }
    }
}
