import cloudinary.uploader

def upload_to_cloudinary(image_path):
    try:
        upload_result = cloudinary.uploader.upload(image_path, folder="exam_proctoring")
        return upload_result
    except Exception as e:
        return {"error": str(e)}
