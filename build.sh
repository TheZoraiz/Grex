cd frontend
echo "Starting frontend build..."
yarn build
echo "Deleting backend public folder..."
rm -rf ../backend/public
echo "Moving new public folder to backend..."
cp -r build/ ../backend/public
cd ..