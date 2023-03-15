node {
    docker.image('node:18').inside {
        stage('Clone repository') {
            checkout scm
        }

        stage('Build Server') {
            sh 'yarn'
            sh 'yarn build'
        }

        stage('Build Client') {
            dir('client') {
                sh 'yarn'
                sh 'yarn build'
            }
        }
    }

    stage('Build image') {
        app = docker.build("st3v0rr/skyoffice", "--no-cache --pull .")
    }

    stage('Push image') {
        docker.withRegistry('https://registry.hub.docker.com', 'dockerhub') {
            app.push("latest")
        }
    }
}
