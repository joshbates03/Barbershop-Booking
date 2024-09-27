using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Google.Cloud.Storage.V1;
using System;

public static class FirebaseAdminHelper
{
    public static void InitializeFirebase()
    {
        string pathToServiceAccountKey = "Config/barbershop-19606-firebase-adminsdk-c2i6x-32b806f80b.json"; 
        Environment.SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", pathToServiceAccountKey);

        FirebaseApp.Create(new AppOptions()
        {
            Credential = GoogleCredential.FromFile(pathToServiceAccountKey)
        });
    }

    public static StorageClient GetStorageClient()
    {
        return StorageClient.Create(GoogleCredential.FromFile("Config/barbershop-19606-firebase-adminsdk-c2i6x-32b806f80b.json"));
    }
}
