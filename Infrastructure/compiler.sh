SOURCE="."
TARGET="../../runtime/tqbb_server/"
MODULE_TRAINERS="./Main_Server/web/trainers/js/"
MODULE_DOWNLOAD="./Main_Server/web/download/js/"
MODULE_GALLERY="./Main_Server/web/gallery/js/"
MODULE_MAGAZINE="./Main_Server/web/magazine/js/"
MODULE_CONSOLE="./Main_Server/web/console/js/"
MODULE_IMAGE_PROCESS="./Main_Server/web/public_js/image_process/"
MODULE_PASSWORD="./Main_Server/web/password/js/"
MODULE_USERS="./Main_Server/web/users/js/"
MODULE_PROXY_JS="./Proxy_Server/js/"

function scanDir()
{
	for file in `ls $1`
	do
	        echo $file
		if [ -d $1"/"$file ]
		then
			scanDir $1"/"$file
		else
			if [ $1"/" = $MODULE_TRAINERS ] || \
			[ $1"/" = $MODULE_GALLERY ] || \
			[ $1"/" = $MODULE_MAGAZINE ] || \
			[ $1"/" = $MODULE_CONSOLE ] || \
			[ $1"/" = $MODULE_IMAGE_PROCESS ] || \
			[ $1"/" = $MODULE_DOWNLOAD ] || \
			[ $1"/" = $MODULE_PASSWORD ] || \
			[ $1"/" = $MODULE_USERS ] || \
			[ $1"/" = $MODULE_PROXY_JS ]
			then
			    echo "compiling file" $1"/"$file
				mkdir -p $TARGET$1
				java -jar compiler.jar --js $1"/"$file --js_output_file $TARGET$1"/"$file
			else
			    echo "copying file" $1"/"$file
				mkdir -p $TARGET$1
				cp -v $1"/"$file $TARGET$1"/"$file
			fi
		fi
	done
}
INIT_PATH="."
#rm -rf $TARGET
scanDir $INIT_PATH
cp $SOURCE"/"run.sh $TARGET
