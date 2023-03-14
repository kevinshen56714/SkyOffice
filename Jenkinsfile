node {
    docker.image('node:18').inside {
        stage('Clone repository') {
            checkout scm
        }

        stage('Build Server') {
            steps {
                sh 'yarn'
                sh 'yarn heroku-postbuild'
            }
        }

        stage('Build Client') {
            steps {
                dir('client') {
                    sh 'yarn'
                    sh 'yarn build'
                }
            }
        }
    }
}
