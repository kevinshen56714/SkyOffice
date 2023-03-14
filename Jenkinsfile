node {
    docker.image('node:18').inside {
        stage('Clone repository') {
            checkout scm
        }

        stage('Build Server') {
            sh 'yarn'
            sh 'yarn heroku-postbuild'
        }

        stage('Build Client') {
            dir('client') {
                sh 'yarn'
                sh 'yarn build'
            }
        }
    }
}
