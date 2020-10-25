.PHONY: install
## install: install dependencies
install:
	@npm install -g aws-cdk@1.70.0 typescript@3.9.7 ts-node@8.10.2
	@ls -al ./
	@npm install
	@ls -al ./

.PHONY: build
## build: build stack
build:
	@npm run build

.PHONY: bootstrap
## bootstrap: deploys the CDK toolkit stack into an AWS environment
bootstrap:
	@cdk bootstrap

.PHONY: diff
## diff: compares the specified stack with the deployed stack or a local template file
diff:
	@cdk diff

.PHONY: deploy
## deploy: deploy stack
deploy:
	@echo "ls -al ./"
	@ls -al ./
	@echo "ls -al ./node_modules"
	@ls -al ./node_modules/
	@echo "ls -al ./node_modules/.bin"
	@ls -al ./node_modules/.bin
	@echo "PATH"
	@echo ${PATH}
	@echo "current_dir"
	current_dir = $(notdir $(shell pwd))
	@# prevent ci build fail (without std output in 10 min)
	@if [ ${CI} = "true" ]; \
	then \
		while true; do echo "====[ ${SECONDS} seconds still running ]====" ; sleep 60 ; done & \
	fi
	@cdk deploy --require-approval never