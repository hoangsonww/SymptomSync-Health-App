import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Work-in-progress... (data is hardcoded for now)
// This page will be the main dashboard for the user
export default function HomePage() {
  return (
    <div className="p-6 md:p-8 flex-1 overflow-y-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">
        Good Morning, Ajay! ☀️
      </h1>
      <p className="text-sm md:text-base text-muted-foreground mb-6">
        Let&apos;s make today a little healthier
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Medicine Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="list-disc ml-5">
              <li>9:00 AM - Ibuprofen 200 mg</li>
              <li>12:00 PM - Metformin 500 mg</li>
              <li>3:00 PM - Vitamin D 1000 IU</li>
              <li>6:00 PM - Paracetamol 500 mg</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log Your Symptoms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-2 text-sm">
              <div>
                <input type="checkbox" id="nausea" className="mr-2" />
                <label htmlFor="nausea">Nausea</label>
              </div>
              <div>
                <input type="checkbox" id="headache" className="mr-2" />
                <label htmlFor="headache">Headache</label>
              </div>
              <div>
                <input type="checkbox" id="fatigue" className="mr-2" />
                <label htmlFor="fatigue">Fatigue</label>
              </div>
              <div>
                <input type="checkbox" id="dizziness" className="mr-2" />
                <label htmlFor="dizziness">Dizziness</label>
              </div>
            </div>
            <div className="mb-4 text-sm">
              <label className="block mb-1 font-medium">Severity Level</label>
              <input type="range" min={0} max={10} className="w-full" />
            </div>
            <Button variant="default" className="w-full">
              Submit
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Medication</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block mb-1 font-medium">Medication</label>
                <input
                  type="text"
                  placeholder="Ibuprofen"
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Dosage</label>
                <input
                  type="text"
                  placeholder="200 mg"
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Schedule</label>
                <input
                  type="text"
                  placeholder="9:00 AM"
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button variant="default" className="w-full mt-2">
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="list-disc ml-5">
              <li>11/20/2023 @ 10:00 AM – General Checkup, Dr. Smith</li>
              <li>11/30/2023 @ 2:00 PM – Physical Therapy</li>
              <li>12/05/2023 @ 4:00 PM – Lab Tests</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block mb-1 font-medium">
                  Appointment Info
                </label>
                <input
                  type="text"
                  placeholder="Check-up"
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Time</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button variant="default" className="w-full mt-2">
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
