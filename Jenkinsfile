pipeline {
	agent any
	
	stages {

		stage('code checkout') {
			steps {
				withCredentials([
					string(credentialsId: 'git-url', variable: 'GIT_URL')
				]) {
					git branch: params.GIT_BRANCH,
					credentialsId: 'github-creds',
					url : GIT_URL
				}
				
			}
		}
		
		
		stage('Docker Build') {
			steps {
				script {
					env.IMAGE_TAG= "${env.BUILD_NUMBER}"
					
					sh '''
					echo " building frontend image"
					docker build -t frontend:${IMAGE_TAG} ./frontend
					
					echo "Building the backend Image"
					docker build -t backend:${IMAGE_TAG} ./backend
				'''
				}
			}
		}
		
		
		stage('scan Image') {
			when {
				expression { return params.RUN_TRIVY }
			}
			steps {
				sh '''
				echo "scanning frontend Image"
				trivy image --severity HIGH,CRITICAL --exit-code 1 frontend:${IMAGE_TAG}
				
				echo "scanning backend image"
				trivy image --severity HIGH,CRITICAL --exit-code 1 backend:${IMAGE_TAG}
				
			'''
			}
		}
		
		stage('Package Image') {
			steps {
				sh '''
				echo "package the Images"
				docker save frontend:${IMAGE_TAG} -o frontend_${IMAGE_TAG}.tar
				docker save backend:${IMAGE_TAG} -o backend_${IMAGE_TAG}.tar
				
			'''
			}
		}
		
		stage('share file to remote server') {
			steps{
				withCredentials([sshUserPrivateKey(
					credentialsId: 'ssh-remote-key',
					keyfileVariable: 'SSH_KEY',
					usernameVariable: 'SSH_USER'
				),
				string(
					credentialsId: 'REMOTE-IP',
					variable: 'REMOTE_IP'
				)
				]) {
					sh '''
					echo 'transfer frontend image'
					scp -i $SSH_KEY frontend_${IMAGE_TAG}.tar \
						$SSH_USER@${REMOTE_IP}:/opt/docker-images/
						
					echo 'transfer backend image'
					scp -i $SSH_KEY backend_${IMAGE_TAG}.tar \
						$SSH_USER@${REMOTE_IP}:/opt/docker-images
				'''
				}
			}
		}
		
		stage('load images on remote server') {
			steps {
				withCredentials([sshUserPrivateKey(
					credentialsId: 'ssh-remote-key',
					keyfileVariable: 'SSH_KEY',
					usernameVarible: 'SSH_user'
				),
				string(credentialsId: 'REMOTE-IP', variable: 'REMOTE_IP')
				]) {
					sh '''
					ssh -i $SSH_KEY $SSH_USER@${REMOTE_IP}
					echo "Loading the frontend image on remote server"
					docker load -i /opt/docker-images/frontend_${IMAGE_TAG}.tar
					
					echo 'loading the backend image'
					docker load -i /opt/docker-images/backend_${IMAGE_TAG}.tar
				"
				'''
				}
			
			}
		}
		
		stage('network and volume creation') {
			steps {
				withCredentials([sshUserPrivatekey(
					credentialsId: 'ssh-remote-key',
					keyFileVariable: 'SSH_KEY',
					usernameVariable: 'SSH_USER'
				),
				string(credentialsId: 'REMOTE-IP', variable: 'REMOTE_IP')
				]) {
					sh '''
					ssh -i $SSH_KEY $SSH_USER@${REMOTE_IP} "
					
					echo 'create a network'
					docker network inspect app_net >/dev/null 2>&1 || docker network create app_net
					
					echo "create volume"
					docker volume inspect frontend_access_logs >/dev/null 2>&1 || docker volume create frontend_access_logs
					docker volume inspect frontend_error_logs >/dev/null 2>&1 || docker volume create frontend_error_logs
					docker volume inspect backend_logs >/dev/null 2>&1 || docker volume create backend_logs
					docker volume inspect mongo_data >/dev/null 2>&1 || docker volume create mongo_data
					docker volume inspect mongo_logs >/dev/null 2>&1 || docker volume create mongo_logs
				"
				'''
				}
			}
		}
		
		stage('Deploy on reomte server') {
			steps {
				withCredentials([sshUserPrivateKey(
					credentialsId: 'ssh-remote-key',
					keyFileVariable: 'SSH_KEY',
					usernameVariable: 'SSH_USER'
				),
				string(credentialsId: 'REMOTE-IP', variable: 'REMOTE_IP'),
				string(credentialsId: 'mongo-user', variable: 'MONGO_USER'),
				string(credentialsId: 'mongo-pass', variable: 'MONGO_PASS'),
				string(credentialsId: 'mongo-db', variable: 'MONGO_DB')
				]) {
					sh '''
					ssh -i $SSH_KEY $SSH_USER@${REMOTE_IP} "
					
					echo 'stop old containers'
					docker stop frontend backend mongodb || true
					docker rm frontend backend mongodb || true
					
					echo 'start mongo container'
					docker run -d --name mongodb --network app_net -v mongo_data:/data/db -v mongo_logs:/var/log/mongodb -e MONGO_INITDB_ROOT_USERNAME=${MONGO_USER} \
						-e MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASS} -e MONGO_INITDB_DATABASE=${MONGO_DB} mongo:7 \
						--logpath /var/log/mongodb/mongod.log --logappend
						
					echo 'starting backend'
					dock run -d --name backend -p 5003:5003 --network app_net -v backend_logs:/app/logs -e MONGO_HOST=mongodb -e MONGO_PORT=27017 \
						-e MONGO_USER=${MONGO_USER} -e MONGO_PASS=${MONGO_PASS} -e MONGO_DB=${MONGO_DB} backend:${IMAGE_TAG}
						
					echo 'Running frontend container'
					docker run -d --name frontend --network app_net -p 80:80 -v frontend_access_logs:/var/log/nginx/access \
						-v frontend_error_logs:/var/log/nginx/error frontend:${IMAGE_TAG}
						
						
					echo 'delete old images'
					docker image prune -f 
				"
				'''
				
				}
			
			}
		
		}
	}
}
