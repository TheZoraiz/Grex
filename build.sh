cd frontend
echo "Starting frontend build..."
yarn build
echo "Moving new public folder to backend..."
cp -r build/* ../backend/public
cd ..