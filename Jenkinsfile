pipeline {
    agent any
    
    stages {
        stage('Checkout Code') {
            steps {
                withCredentials([
                    string(credentialsId: 'github-repo-url', variable: 'GIT_URL')
                ]) {
                    git branch: params.GIT_BRANCH,
                        credentialsId: 'github-creds',
                        url: GIT_URL
                }
            }
        }

        stage('Build Images') {
            parallel{
                stage('Build Frontend Image') {
                    steps {
                        script {
                            env.IMAGE_TAG = "${BUILD_NUMBER}"
                            sh '''
                                echo "Build Frontend Image"
                                docker build -t frontend:${IMAGE_TAG} ./frontend
                            '''
                        }
                    }
                }
                stage('Build Backend Image') {
                    steps {
                        script {
                            env.IMAGE_TAG = "${BUILD_NUMBER}"
                            sh '''
                                echo "Build Backend Image"
                                docker build -t backend:${IMAGE_TAG} ./backend
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Trivy Image Scan') {
            when {
                expression { return params.RUN_TRIVY }
            }
            steps {
                sh '''
                echo "Scanning frontend image using trivy"
                trivy image --severity HIGH,CRITICAL --exit-code 1 frontend:${IMAGE_TAG}

                echo "Scanning backend image using trivy"
                trivy image --severity HIGH,CRITICAL --exit-code 1 backend:${IMAGE_TAG}
            '''
            }
        }
        
        stage('Package Docker Images ') {
            parallel {
                stage('Save Frontend Image') {
                    steps {
                        sh '''
                            docker save frontend:${IMAGE_TAG} -o frontend_${IMAGE_TAG}.tar
                        '''
                    }
                }
                stage('Save Backend Image') {
                    steps {
                        sh '''
                            docker save backend:${IMAGE_TAG} -o backend_${IMAGE_TAG}.tar
                        '''
                    }
                }
            }
        }
        
        stage('Copy Images to Remote Server') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'remote-ssh-key',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USER'
                ),
                string(
                    credentialsId: 'REMOTE-IP',
                    variable: 'REMOTE_IP'
                    )
                ]) {
                    sh '''
                    echo "Copying frontend image to remote"
                    scp -i $SSH_KEY frontend_${IMAGE_TAG}.tar \
                        $SSH_USER@${REMOTE_IP}:/opt/docker-images/
        
                    echo "Copying backend image to remote"
                    scp -i $SSH_KEY backend_${IMAGE_TAG}.tar \
                        $SSH_USER@${REMOTE_IP}:/opt/docker-images/
                    '''
                }
            }
        }
        
        stage('Load Images on Remote server') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'remote-ssh-key',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USER'
                ),
                string(
                    credentialsId: 'REMOTE-IP',
                    variable: 'REMOTE_IP'
                    )
                ]) {
                    sh '''
                    ssh -i $SSH_KEY $SSH_USER@${REMOTE_IP} "
                        docker load -i /opt/docker-images/frontend_${IMAGE_TAG}.tar &&
                        docker load -i /opt/docker-images/backend_${IMAGE_TAG}.tar
                    "
                    '''
                }
            }
        }

        stage('network and Volumes Infratructure management') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'remote-ssh-key',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USER'
                ),
                string(
                    credentialsId: 'REMOTE-IP',
                    variable: 'REMOTE_IP'
                    )
                ]) {
                    sh '''
                    ssh -i $SSH_KEY $SSH_USER@${REMOTE_IP} "
        
                        echo 'Creating network if not exists on remote server'
                        docker network inspect app_net >/dev/null 2>&1 || docker network create app_net
        
                        echo 'Creating volumes if not exists on remote server'
                        docker volume inspect frontend_access_logs >/dev/null 2>&1 || docker volume create frontend_access_logs
                        docker volume inspect frontend_error_logs  >/dev/null 2>&1 || docker volume create frontend_error_logs
                        docker volume inspect backend_logs         >/dev/null 2>&1 || docker volume create backend_logs
                        docker volume inspect mongo_logs           >/dev/null 2>&1 || docker volume create mongo_logs
                        docker volume inspect mongo_data           >/dev/null 2>&1 || docker volume create mongo_data
                    "
                    '''
                }
            }
        }
        
        stage('Deploy on remote server') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'remote-ssh-key',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    ),
                    string(credentialsId: 'mongo-user', variable: 'MONGO_USER'),
                    string(credentialsId: 'mongo-pass', variable: 'MONGO_PASS'),
                    string(credentialsId: 'mongo-db',   variable: 'MONGO_DB'),
                    string(credentialsId: 'REMOTE-IP', variable: 'REMOTE_IP')
                ]) {
                    sh '''
                    ssh -i $SSH_KEY $SSH_USER@${REMOTE_IP} "
        
                        echo 'Stopping old container'
                        docker stop frontend backend mongodb || true
                        docker rm frontend backend mongodb || true
        
                        echo 'Starting MongoDB container'
                        docker run -d \
                          --name mongodb \
                          --network app_net \
                          -v mongo_data:/data/db \
                          -v mongo_logs:/var/log/mongodb \
                          -e MONGO_INITDB_ROOT_USERNAME=${MONGO_USER} \
                          -e MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASS} \
                          -e MONGO_INITDB_DATABASE=${MONGO_DB} \
                          mongo:7 \
                          --logpath /var/log/mongodb/mongod.log --logappend
        
                        echo 'Starting Backend container'
                        docker run -d \
                          --name backend \
                          --network app_net \
                          -p 5003:5003 \
                          -e MONGO_HOST=mongodb \
                          -e MONGO_PORT=27017 \
                          -e MONGO_USER=${MONGO_USER} \
                          -e MONGO_PASS=${MONGO_PASS} \
                          -e MONGO_DB=${MONGO_DB} \
                          -v backend_logs:/app/logs \
                          backend:${IMAGE_TAG}
        
                        echo 'Starting Frontend container'
                        docker run -d \
                          --name frontend \
                          --network app_net \
                          -p 80:80 \
                          -v frontend_access_logs:/var/log/nginx/access \
                          -v frontend_error_logs:/var/log/nginx/error \
                          frontend:${IMAGE_TAG}

                    "
                    '''
                }
            }
        }
    }

    post {
        success {
            emailext(
                to: 'jenkinstest360@gmail.com',
                subject: "SUCCESS: ${JOB_NAME} #${BUILD_NUMBER}",
                body: "Job=${JOB_NAME} | Build=${BUILD_NUMBER} | SUCCESS | URL=${BUILD_URL}",
                attachLog: true
            )
            writeFile file: 'frontend_image.txt', text: "frontend:${BUILD_NUMBER}"
            writeFile file: 'backend_image.txt',  text: "backend:${BUILD_NUMBER}"

            archiveArtifacts artifacts: '*.txt, *.tar', fingerprint: true
        }
    
        failure {
            emailext(
                to: 'jenkinstest360@gmail.com',
                subject: "FAILED: ${JOB_NAME} #${BUILD_NUMBER}",
                body: "Job=${JOB_NAME} | Build=${BUILD_NUMBER} | FAILED | ${BUILD_URL}",
                attachLog: true
            )

            withCredentials([
                sshUserPrivateKey(
                    credentialsId: 'remote-ssh-key',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USER'
                ),
                string(credentialsId: 'REMOTE-IP', variable: 'REMOTE_IP'),
                string(credentialsId: 'mongo-user', variable: 'MONGO_USER'),
                string(credentialsId: 'mongo-pass', variable: 'MONGO_PASS'),
                string(credentialsId: 'mongo-db',   variable: 'MONGO_DB')
            ]) {
                script {
                    def prev = currentBuild.previousSuccessfulBuild
                    if (!prev) {
                        echo "No previous successful build found. Rollback skipped."
                        return
                    }

                    echo "Rolling back to build #${prev.number}"

                    copyArtifacts(
                        projectName: env.JOB_NAME,
                        selector: specific("${prev.number}")
                    )

                    def FRONTEND_IMAGE = readFile('frontend_image.txt').trim()
                    def BACKEND_IMAGE  = readFile('backend_image.txt').trim()

                    sh """
                    ssh -i $SSH_KEY $SSH_USER@${REMOTE_IP} '
                        docker stop frontend backend || true
                        docker rm frontend backend || true

                        docker run -d --name backend --network app_net -p 5003:5003 -e MONGO_HOST=mongodb -e MONGO_PORT=27017 -e MONGO_USER=${MONGO_USER} -e MONGO_PASS=${MONGO_PASS} -e MONGO_DB=${MONGO_DB} -v backend_logs:/app/logs ${BACKEND_IMAGE}

                        docker run -d --name frontend --network app_net -p 80:80 -v frontend_access_logs:/var/log/nginx/access -v frontend_error_logs:/var/log/nginx/error ${FRONTEND_IMAGE}

                    '
                    """
                }
            }
        }
    }
}
