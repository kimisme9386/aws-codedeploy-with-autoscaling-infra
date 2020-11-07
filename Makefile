.PHONY: install
## install: install dependencies
install:
	@npm install -g aws-cdk@1.70.0
	@npm install

.PHONY: build
## build: build stack
build:
	@npm run build

.PHONY: bootstrap
## bootstrap: deploys the CDK toolkit stack into an AWS environment
bootstrap:
	@cdk bootstrap -c region=${DEPLOY_REGION}

.PHONY: diff
## diff: compares the specified stack with the deployed stack or a local template file
diff:
	@cdk diff -c region=${DEPLOY_REGION}

.PHONY: deploy
## deploy: deploy stacks
deploy:
	@# prevent ci build fail (without std output in 10 min)
	@if [ ${CI} = "true" ]; \
	then \
		while true; do echo "====[ still running ]====" ; sleep 60 ; done & \
	fi
	@cdk deploy --require-approval never -c region=${DEPLOY_REGION}

.PHONY: test
test:
	npm test

.PHONY: lint
lint:
	@npm run lint	