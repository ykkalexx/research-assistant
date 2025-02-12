import { Modal, Button, Text, Group } from "@mantine/core";
import { useState } from "react";
import { Dropzone } from "@mantine/dropzone";
import { IconUpload, IconX, IconFile } from "@tabler/icons-react";
import axios from "axios";

export const UploadModal = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      console.log("hit 1");

      const response = await axios.post(
        "http://localhost:3000/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        console.log("it worked yay :3");
        setOpen(false);
        setFile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-light">
      <Button onClick={() => setOpen(true)} color="blue">
        Upload PDF
      </Button>

      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title="Upload a Document"
        size="lg"
      >
        <div className="space-y-4">
          <Dropzone
            onDrop={(files) => setFile(files[0])}
            maxSize={10 * 1024 * 1024}
            accept={["application/pdf"]}
            loading={loading}
          >
            <Group
              position="center"
              spacing="xl"
              style={{ minHeight: 220, pointerEvents: "none" }}
            >
              <Dropzone.Accept>
                <IconUpload size={50} stroke={1.5} color="blue" />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX size={50} stroke={1.5} color="red" />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconFile size={50} stroke={1.5} />
              </Dropzone.Idle>

              <div>
                <Text size="xl" inline>
                  Drag & drop PDF here or click to select
                </Text>
                <Text size="sm" color="dimmed" inline mt={7}>
                  File should not exceed 10MB
                </Text>
              </div>
            </Group>
          </Dropzone>

          {file && (
            <div className="p-4 bg-gray-50 rounded-md">
              <Text>Selected file: {file.name}</Text>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-md">{error}</div>
          )}

          <Group position="right" mt="md">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              loading={loading}
              disabled={!file || loading}
            >
              Upload
            </Button>
          </Group>
        </div>
      </Modal>
    </div>
  );
};
